import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { assetManager } from '../../utils/assetManager.js';
import {
  B2C_GameStartNotificationSchema,
  B2C_JoinRoomRequestSchema,
} from '../../protocol/room_pb.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { fromBinary, create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { MonsterSpawner } from './monsterSpanwner.js';
import { GamePlayerDataSchema, PosInfoSchema, TowerDataSchema } from '../../protocol/struct_pb.js';
import { Monster } from '../game/monster.js';
import { B2C_SpawnMonsterNotificationSchema } from '../../protocol/monster_pb.js';
import { C2B_PlayerPositionUpdateRequestSchema } from '../../protocol/character_pb.js';
import {
  B2C_TowerBuildNotificationSchema,
  B2C_TowerBuildResponseSchema,
  B2C_TowerAttackNotificationSchema,
  C2B_TowerDestroyNotificationSchema,
  C2B_TowerDestroyResponseSchema,
  B2C_ObstacleSpawnNotificationSchemaSchema,
} from '../../protocol/tower_pb.js';
import { v4 as uuidv4 } from 'uuid';

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
    console.log(`유저가 방에 입장했습니다. 현재 인원: ${this.users.size}/${this.maxPlayerCount}`);
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
          prefabId: user.playerData.prefabId,
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

    setInterval(() => {
      this.gameLoop();
    }, 200);
  }

  getMonsterCount() {
    return this.monsters.size;
  }

  /**---------------------------------------------
   * [이동 동기화]
   * @param {Buffer} buffer - 이동 패킷 데이터
   * @param {C2B_PlayerPositionUpdateRequest} clientPacket - 이동 패킷 데이터
   ---------------------------------------------*/
  handleMove(clientPacket, session) {
    // 위치 검증
    if (!this.validatePosition(clientPacket.posInfos)) {
      console.log(`유효하지 않은 위치. ${clientPacket.posInfos}`);
      return;
    }

    const packet = create(C2B_PlayerPositionUpdateRequestSchema, {
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
   * @param {C2B_TowerBuildRequest} packet - 타워 생성 패킷 데이터
   ---------------------------------------------*/
  handleTowerBuild(packet, session) {
    console.log('handleTowerBuild');
    const { tower, ownerId } = packet;

    // 1. 타워 데이터 존재 확인
    const towerData = assetManager.getTowerData(tower.prefabId);
    if (!towerData) {
      const failResponse = create(B2C_TowerBuildResponseSchema, {
        isSuccess: false,
      });

      const failBuffer = PacketUtils.SerializePacket(
        failResponse,
        B2C_TowerBuildResponseSchema,
        ePacketId.B2C_TowerBuildResponse,
        session.getNextSequence(),
      );

      session.send(failBuffer);
      return;
    }

    // 1. 타워 생성 가능 여부 검증 (범위, 위치)
    // if (!this.validateTowerBuild(tower.towerPos)) {
    //   // 실패 응답
    //   const failResponse = create(B2C_TowerBuildResponseSchema, {
    //     isSuccess: false,
    //     tower: null,
    //   });

    //   const failBuffer = PacketUtils.SerializePacket(
    //     failResponse,
    //     B2C_TowerBuildResponseSchema,
    //     ePacketId.B2C_TowerBuildResponse,
    //     session.getNextSequence(),
    //   );

    //   session.send(failBuffer);
    //   return;
    // }

    // 2. 타워 정보 저장
    // 클래스로 변경하기
    const newTower = {
      //uuid생성하기
      towerPos: tower.towerPos,
      ownerId: ownerId,
      prefabId: towerData.prefabId,
    };

    this.towerList.set(tower.towerNumber, newTower);
    console.log(
      `타워생성 성공. towerId: ${tower.towerId}, prefabId: ${towerData.prefabId}, 위치: (${tower.towerPos}`,
    );

    // 3. 타워 생성 성공 응답
    const successResponse = create(B2C_TowerBuildResponseSchema, {
      isSuccess: true,
      tower: create(TowerDataSchema, {
        towerId: uuidv4(),
        prefabId: packet.tower.prefabId,
        towerPos: packet.tower.towerPos,
      }),
    });

    const responseBuffer = PacketUtils.SerializePacket(
      successResponse,
      B2C_TowerBuildResponseSchema,
      ePacketId.B2C_TowerBuildResponse,
      session.getNextSequence(),
    );

    session.send(responseBuffer);

    // 4. 모든 클라이언트에게 타워 추가 알림
    const notification = create(B2C_TowerBuildNotificationSchema, {
      tower: packet.tower,
      ownerId: packet.ownerId,
    });

    console.log('-------------');
    console.log(packet.tower);
    console.log(packet.ownerId);
    console.log('-------------');
    const notificationBuffer = PacketUtils.SerializePacket(
      notification,
      B2C_TowerBuildNotificationSchema,
      ePacketId.B2C_TowerBuildNotification,
      session.getNextSequence(),
    );

    this.broadcast(notificationBuffer);
  }

  /**---------------------------------------------
   * [타워 공격 동기화]
   * @param {C2B_TowerAttackRequest} packet - 타워 공격 패킷 데이터
   * @param {Session} session - 세션 정보
   ---------------------------------------------*/
  handleTowerAttack(packet, session) {
    // 몬스터 길 찾기 완료 후 수정 예정
    console.log('handleTowerAttack');
    const { towerId, targetId } = packet;

    // 1. 타워와 타겟 존재 확인
    const tower = this.towerList.get(towerId);
    const target = this.monsters.get(targetId);

    // 타워나 타겟이 존재하지 않으면
    if (!tower || !target) {
      console.log(`타워 or 타겟이 존재하지 않음. towerId: ${towerId}, targetId: ${targetId}`);
      const failNotification = create(B2C_TowerAttackNotificationSchema, {
        isSuccess: false,
        damage: 0,
        targetHealth: 0,
      });

      const failBuffer = PacketUtils.SerializePacket(
        failNotification,
        B2C_TowerAttackNotificationSchema,
        ePacketId.B2C_TowerAttackNotification,
        session.getNextSequence(),
      );

      session.send(failBuffer);
      return;
    }

    // 2. B2C_TowerAttackNotification 패킷 생성
    const notification = create(B2C_TowerAttackNotificationSchema, {
      isSuccess: true,
      damage: 0,
      targetHealth: 0,
    });

    const notificationBuffer = PacketUtils.SerializePacket(
      notification,
      B2C_TowerAttackNotificationSchema,
      ePacketId.B2C_TowerAttackNotification,
      session.getNextSequence(),
    );

    this.broadcast(notificationBuffer);
  }

  /**---------------------------------------------
   * [타워 파괴 동기화]
   * @param {C2B_TowerDestroyRequest} packet - 타워 파괴 패킷 데이터
   * @param {Session} session - 세션 정보
   ---------------------------------------------*/
  handleTowerDestroy(packet, session) {
    // 몬스터 길 찾기 완료 후 수정 예정
    console.log('handleTowerDestroy');
    const { towerId } = packet;

    // 1. 타워가 있는지 확인
    const tower = this.towerList.get(towerId);
    if (!tower) {
      console.log(`타워가 존재하지 않음. towerId: ${towerId}`);
      const failResponse = create(C2B_TowerDestroyResponseSchema, {
        towerId: -1, // 실패
      });

      const failBuffer = PacketUtils.SerializePacket(
        failResponse,
        C2B_TowerDestroyResponseSchema,
        ePacketId.C2B_TowerDestroyResponse,
        session.getNextSequence(),
      );

      session.send(failBuffer);
      return;
    }

    // 2. 타워 제거
    this.towerList.delete(towerId);
    console.log(`[타워] 파괴 성공. towerId: ${towerId}`);

    // 3. 요청한 클라이언트에게 응답
    const response = create(C2B_TowerDestroyResponseSchema, {
      towerId: towerId,
    });

    const responseBuffer = PacketUtils.SerializePacket(
      response,
      C2B_TowerDestroyResponseSchema,
      ePacketId.C2B_TowerDestroyResponse,
      session.getNextSequence(),
    );

    session.send(responseBuffer);

    // 4. 모든 클라이언트에게 타워 파괴 알림
    const notification = create(C2B_TowerDestroyNotificationSchema, {
      towerId: towerId,
    });

    const notificationBuffer = PacketUtils.SerializePacket(
      notification,
      C2B_TowerDestroyNotificationSchema,
      ePacketId.C2B_TowerDestroyNotification,
      session.getNextSequence(),
    );

    this.broadcast(notificationBuffer);
  }

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
  }

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
  /**---------------------------------------------
   * 타워 생성 가능 여부 검증
   * @param {PosInfo} position - 타워 생성 위치
   * @returns {boolean} - 생성 가능 여부
   ---------------------------------------------*/
  // validateTowerBuild(position) {
  //   // 1. 32x32 맵 범위 확인
  //   if (position.x < 0 || position.x >= 32 || position.y < 0 || position.y >= 32) {
  //     return false;
  //   }

  //   // 2. 타워 중복 확인
  //   for (const [_, tower] of this.towerList) {
  //     if (position.x === tower.towerPos.x && position.y === tower.towerPos.y) {
  //       return false;
  //     }
  //   }

  //   return true;
  // }

  /**---------------------------------------------
   * 이동 위치 검증
   * @param {PosInfo} position - 검증할 위치 정보
   * @returns {boolean} - 유효한 위치인지 여부
   ---------------------------------------------*/
  validatePosition(position) {
    // 맵 범위 검증 (32x32 맵)
    if (position.x < -16 || position.x > 16 || position.y < -16 || position.y > 16) {
      console.log(`맵 범위 초과. 위치: ${position.x}, ${position.y}`);
      return false;
    }

    return true;
  }

  /**
   * 게임 루프 시작
   */
  gameLoop() {
    //몬스터(Monster) 업데이트
    for (const [uuid, monster] of this.monsters) {
      monster.update();
    }

    // 타워(Tower) 업데이트
    for (const [uuid, tower] of this.towers) {
      tower.update();
    }
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

    const obstacleSpawnPacket = create(B2C_ObstacleSpawnNotificationSchemaSchema, {
      obstacles: this.obstacles,
    });

    const obstacleBuffer = PacketUtils.SerializePacket(
      obstacleSpawnPacket,
      B2C_ObstacleSpawnNotificationSchemaSchema,
      ePacketId.B2C_ObstacleSpawnNotification,
      session.getNextSequence(),
    );

    this.broadcast(obstacleBuffer);
  }
}
