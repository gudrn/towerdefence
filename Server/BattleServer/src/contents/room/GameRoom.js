import { ePacketId } from 'ServerCore/src/network/packetId.js';
import {
  B2C_GameStartNotificationSchema,
  B2C_JoinRoomRequestSchema,
} from '../../protocol/room_pb.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { fromBinary, create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { MonsterSpawner } from './monsterSpanwner.js';
import { GamePlayerDataSchema, PosInfoSchema } from '../../protocol/struct_pb.js';
import { Monster } from '../game/monster.js';
import { B2C_SpawnMonsterNotificationSchema } from '../../protocol/monster_pb.js';
import { B2C_PositionUpdateNotificationSchema } from '../../protocol/character_pb.js';

export class GameRoom {
  static spawnCoordinates = [
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
  ];

  /**---------------------------------------------
   * @param {number} id - 방의 고유 ID
   * @param {number} maxPlayerCount - 최대 플레이어 수
   * @param {string} towerList - 타워 저장
   ---------------------------------------------*/
  constructor(id, maxPlayerCount) {
    this.users = new Map();
    this.id = id;
    this.monsters = new Map();
    this.towerList = new Map();
    this.grid = { width: 32, height: 32 };
    this.base = this.baseSize(5, 3); // 기지의 좌표
    this.obstacles = []; // 장애물 좌표 배열
    this.excludedCoordinates = [...this.base]; // 장애물이 생성되지 않도록 할 좌표 목록

    this.maxPlayerCount = maxPlayerCount;
    this.monsterSpawner = new MonsterSpawner(this);

    this.generateObstacles(); // 장애물 랜덤 배치
    this.updateInterval = 200; // 200ms 간격으로 업데이트
  }

  /**
   * Base 좌표 생성 함수
   * @param {number} width - 가로 크기
   * @param {number} height - 세로 크기
   * @returns {Array} 좌표 배열
   */
  baseSize(width, height) {
    const base = [];
    const halfWidth = Math.floor(width / 2);
    const halfHeight = Math.floor(height / 2);

    for (let y = -halfHeight; y <= halfHeight; y++) {
      for (let x = -halfWidth; x <= halfWidth; x++) {
        base.push({ x: x, y: y }); // 음수-양수 좌표 생성
      }
    }

    return base;
  }

  getMonsterList() {
    return this.monsters;
  }

  getTowerList() {
    return this.monsters;
  }

  getobstacles() {
    return this.obstacles;
  }

  // 1. 방이 가득 찼는지 확인
  addplayer(player) {
    if (this.users.length >= this.maxPlayerCount) {
      console.log('this.users.length: ' + this.users.length);
      console.log('this.maxPlayerCount: ' + this.maxPlayerCount);
      return false; // 방이 가득 참
    }
    if (this.users.get(player.id) != undefined) {
      return false; // 중복 플레이어
    }
    // 2. 유저 추가
    this.users.set(player.session.getId(), player);
    console.log(`유저가 방에 입장했습니다. 현재 인원: ${this.users.length}/${this.maxPlayerCount}`);
    return true;
  }

  /**---------------------------------------------
   * [방 입장]
   * @param {GamePlayer} player - 입장할 플레이어 정보
   * @returns {boolean} - 추가 성공 여부
    
    // 1. 방이 가득 찼는지 확인
    // 2. 유저 추가
    // 3. 해당 유저에게 B2C_JoinRoomResponse패킷 전송
    // 4. 모든 인원이 들어왔다면 B2C_GameStart패킷 전송
   ---------------------------------------------*/
  enterRoom(player) {
    // 1. 방이 가득 찼는지 확인
    // 2. 유저 추가
    const success = this.addplayer(player); // addPlayer: 방 객체에서 플레이어를 추가하는 메서드
    if (!success) {
      console.log(`플레이어를 방에 추가하지 못했습니다. roomId: ${this.id}, player: ${player.id}`);
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '방 입장에 실패했습니다.');
    }
    // 3. 해당 유저에게 B2C_JoinRoomResponse 패킷 전송
    const enterRoomPacket = create(B2C_JoinRoomRequestSchema, {
      isSuccess: true,
    });

    const enterRoomBuffer = PacketUtils.SerializePacket(
      enterRoomPacket,
      B2C_JoinRoomRequestSchema,
      ePacketId.B2C_JoinRoomResponse,
      player.session.getNextSequence(),
    );
    player.session.send(enterRoomBuffer);

    // 4. 모든 인원이 들어왔다면 B2C_GameStart 패킷 전송
    if (this.users.size === this.maxPlayerCount) {
      console.log('모든 유저가 입장하였습니다. 게임을 시작합니다.');

      // 유저의 스폰 위치 부여
      const playerDatas = [];

      // Map의 값(value)을 배열로 변환하여 순회
      const usersArray = Array.from(this.users.values());
      for (let i = 0; i < usersArray.length; i++) {
        const user = usersArray[i];
        const spawnPoint = GameRoom.spawnCoordinates[i]; // 좌표 목록에서 순차적으로 할당

        const posInfo = create(PosInfoSchema, {
          uuid: user.session.getId(),
          x: spawnPoint.x,
          y: spawnPoint.y,
        });

        const gamePlayerData = create(GamePlayerDataSchema, {
          position: posInfo,
          nickname: user.playerData.nickname,
          characterType: user.playerData.characterType,
        });

        playerDatas.push(gamePlayerData);
      }

      // B2C_GameStartNotification 패킷 생성
      const gameStartPacket = create(B2C_GameStartNotificationSchema, {
        playerDatas,
      });

      const gameStartBuffer = PacketUtils.SerializePacket(
        gameStartPacket,
        B2C_GameStartNotificationSchema,
        ePacketId.B2C_GameStartNotification,
        usersArray[0].session.getNextSequence(), // 첫 번째 유저의 시퀀스
      );

      // 모든 유저에게 전송
      this.broadcast(gameStartBuffer);

      //몬스터 생성
      this.OnGameStart();
    }
  }

  OnGameStart() {
    console.log('OnGameStart Called');
    this.monsterSpawner.startSpawning(0);
  }

  getMonsterCount() {
    return this.monsters.size;
  }

  /**---------------------------------------------
   * [이동 동기화]
   * @param {Buffer} buffer - 이동 패킷 데이터
   * @param {C2B_PositionUpdateRequest} clientPacket - 이동 패킷 데이터
   ---------------------------------------------*/
  handleMove(clientPacket, session) {
    //[TODO] 해당 위치가 정상적인 위치인지 검증하기
    const packet = create(B2C_PositionUpdateNotificationSchema, {
      posInfos: create(PosInfoSchema, {
        uuid: session.getId(),
        x: clientPacket.posInfos?.x,
        y: clientPacket.posInfos?.y,
      }),
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2C_PositionUpdateNotificationSchema,
      ePacketId.B2C_PositionUpdateNotification,
      0,
    );
    this.broadcast(sendBuffer);
  }

  /**---------------------------------------------
   * [카드 사용 동기화]
   * @param {Buffer} buffer - 카드 사용 패킷 데이터
   ---------------------------------------------*/
  handleUseCard(buffer) {}

  /**---------------------------------------------
   * [스킬 사용 동기화]
   * @param {Buffer} buffer - 스킬 사용 패킷 데이터
   ---------------------------------------------*/
  handleSkill(buffer) {}

  /**---------------------------------------------
   * [타워 생성 동기화]
   * @param {Buffer} buffer - 타워 생성 패킷 데이터
   ---------------------------------------------*/
  handleTowerBuild(buffer) {}

  /**---------------------------------------------
   * [타워 공격 동기화]
   * @param {Buffer} buffer - 타워 공격 패킷 데이터
   ---------------------------------------------*/
  handleTowerAttack(buffer) {}

  /**---------------------------------------------
   * [타워 파괴 동기화]
   * @param {Buffer} buffer - 타워 파괴 패킷 데이터
   ---------------------------------------------*/
  handleTowerDestroy(buffer) {}

  /**---------------------------------------------
   * [몬스터 생성]
   ---------------------------------------------*/
  handleSpawnMonster(session) {}

  /**---------------------------------------------
   * [몬스터 타워 공격 동기화]
   * @param {Buffer} buffer - 몬스터 타워 공격 패킷 데이터
   ---------------------------------------------*/
  handleMonsterAttackTower(buffer) {
    const moster = this.monsters.find((m) => m.id === buffer.id); //걍 막 하는중
    if (!moster) {
      //오류
    }
    const target = this.towerList.get(buffer.towerid);

    moster.attackTarget(target);

    if (target.hp <= 0) {
      this.towerList.delete(buffer.towerid);
    }

    //보내는 패킷을 고민해야함
    //2024-11-25 오후 9:22 김형구 샤워하고 옴
  }

  /**---------------------------------------------
   * [타워 HP 동기화]
   * @param {Buffer} buffer - 타워 HP 패킷 데이터
   ---------------------------------------------*/
  handleUpdateTowerHP(buffer) {}

  /**---------------------------------------------
   * [몬스터 기지 공격 동기화]
   * @param {Buffer} buffer - 몬스터 기지 공격 패킷 데이터
   ---------------------------------------------*/
  handleMonsterAttackBase(buffer) {}

  /**---------------------------------------------
   * [몬스터 사망 동기화]
   * @param {Buffer} buffer - 몬스터 사망 패킷 데이터
   ---------------------------------------------*/
  handleMonsterDeath(buffer) {}

  /**---------------------------------------------
   * [broadcast] - 모든 유저에게 패킷 전송
   * @param {Buffer} buffer - 전송할 데이터 버퍼
   ---------------------------------------------*/
  broadcast(buffer) {
    for (const user of this.users) {
      user[1].session.send(buffer);
    }
  }

  /**---------------------------------------------
   * 방의 현재 플레이어 정보 반환
   * @returns {Array} - 플레이어 정보 배열
   ---------------------------------------------*/
  getPlayersInfo() {
    return this.users.map((player) => ({
      id: player.id,
      name: player.name,
    }));
  }

  /**
   * 게임 루프 시작
   */
  monsterActionLoop(session) {
    setInterval(() => {
      for (const monster of this.monsters.values()) {
        monster.monsterAction(session); // 몬스터 이동 및 주기적 동기화
      }
    }, this.updateInterval);
  }

  /**---------------------------------------------
   * 오브젝트 추가
   * 대상: 몬스터, 타워, 투사체
   * 주의: 플레이어는 enterRoom으로 추가하기 
   * @param {Monster | Tower | Projectile} object - 생성할 오브젝트
   * @returns {void}
   ---------------------------------------------*/
  addObject(object) {
    if (object instanceof Monster) {
      this.monsters.set(object.getId(), object);
      console.log('몬스터 생성');

      const packet = create(B2C_SpawnMonsterNotificationSchema, {
        posInfos: object.getPos(),
        prefabId: object.getPrefabId(),
      });

      /**
       * @type {Buffer} sendBuffer
       */
      const sendBuffer = PacketUtils.SerializePacket(
        packet,
        B2C_SpawnMonsterNotificationSchema,
        ePacketId.B2C_SpawnMonsterNotification,
        0,
      );
      this.broadcast(sendBuffer);
    }
  }

  /**---------------------------------------------
   * 오브젝트 제거
   ---------------------------------------------*/
  removeObject(uuid) {
    const object = this.findObject(uuid);

    if (object instanceof GamePlayer) {
      this.users.delete(uuid);
    } else if (object instanceof Monster) {
      this.monsters.delete(uuid);
    }

    this.monsters.forEach((monster) => {
      monster.updateEnvironment(this.obstacles, this.towerList);
    });
  }

  getMonsterSearchAndReward = (monster) => {
    const reward = monsterInfo.monsterInfo[monster.monsterNumber - 1];
    this.score += reward.score;
  };

  /**
   * 장애물과 타워 정보를 갱신
   * @param {Array<object>} obstacles - 장애물 좌표 배열
   * @param {Map<string, object>} towers - 타워 좌표 Map
   */
  updateEnvironment(obstacles, towers) {
    this.obstacles = obstacles;
    this.towers = towers;
  }

  /**
   * 장애물 랜덤 배치
   */
  generateObstacles() {
    const totalCells = this.grid.width * this.grid.height; // 전체 셀 개수
    const obstacleCount = Math.floor(totalCells * 0.1); // 장애물 개수 조절 (10%)
    const obstacleSet = new Set();

    // "생성 금지 좌표"를 문자열로 변환하여 비교에 사용
    const excludedSet = new Set(this.excludedCoordinates.map(({ x, y }) => `${x},${y}`));

    while (obstacleSet.size < obstacleCount) {
      const randomX = Math.floor(Math.random() * 22) - 11;
      const randomY = Math.floor(Math.random() * 28) - 14;
      const coordinate = `${randomX},${randomY}`;

      // 생성 금지 좌표가 아니라면 추가
      if (!excludedSet.has(coordinate)) {
        obstacleSet.add(coordinate);
      }
    }

    this.obstacles = Array.from(obstacleSet).map((coordinate) => {
      const [x, y] = coordinate.split(',').map(Number);
      return { x, y };
    });

    console.log('장애물 배치 완료:', this.obstacles);

    const obstacleSpawnPacket = create(B2C_ObstacleSpawnNotificationSchema, {
      obstacles: this.obstacles,
    });

    const obstacleBuffer = PacketUtils.SerializePacket(
      obstacleSpawnPacket,
      B2C_ObstacleSpawnNotificationSchema,
      ePacketId.B2C_ObstacleSpawnNotification,
      session.getNextSequence(),
    );

    this.broadcast(obstacleBuffer);
  }
}
