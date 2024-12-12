import { Monster } from '../game/monster';
import { create } from '@bufbuild/protobuf';
import { GamePlayerDataSchema, PosInfo, PosInfoSchema } from 'src/protocol/struct_pb';
import { Base } from '../game/base';
import { MonsterSpawner } from './monsterSpanwner';
import { Tile, Tilemap } from './tilemap';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { Tower } from '../game/tower';
import { Vec2 } from 'ServerCore/utils/vec2';
import { gameRoomManager } from './gameRoomManager';
import { MathUtils } from 'src/utils/mathUtils';
import { BattleSession } from 'src/main/session/battleSession';
import { assetManager } from 'src/utils/assetManager';
import { C2B_PlayerPositionUpdateRequest } from 'src/protocol/character_pb';
import { v4 as uuidv4 } from 'uuid';
import { GamePlayer } from '../game/gamePlayer';
import {
  createAddObject,
  createEndGame,
  createEnterRoom,
  createGameStart,
  createIcreaseWave,
  createPosionUpdate,
} from 'src/packet/gameRoomPacket';
import {
  createTowerBuildNotificationPacket,
  createTowerBuildPacket,
  createTowerHealNotificationPacket,
} from 'src/packet/towerPacket';
import { SkillManager } from './skillManager';
import { MonsterManager } from './monsterManager';
import { SkillUseMonster } from '../game/skillUseMonster';

interface PQNode {
  cost: number;
  pos: Vec2;
}

export class GameRoom {
  //유저의 스폰 위치
  static spawnCoordinates = [
    { x: 18, y: 19 },
    { x: 19, y: 19 },
    { x: 18, y: 18 },
    { x: 19, y: 18 },
  ];

  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  public id: number;
  public users: Map<string, GamePlayer>;
  private monsterManager: MonsterManager;
  private towers: Map<string, Tower>;
  private maxPlayerCount: number;
  private tilemap: Tilemap;
  private base: Base;
  private updateInterval: number = 200; // 200ms 간격으로 업데이트

  private score: number = 0; // 현재 점수
  private rewardScore: number = 10;
  private wave = 1; // 현재 웨이브
  public monsterStatusMultiplier = 1; // 몬스터 강화 계수 (wave만으론 강화가 불가능한가요?) --12.06 조정현
  private gameLoopInterval: any = null; //gameLoop를 저장 후 방 제거 시 clear하기 위함
  private skillManager: SkillManager;

  constructor(id: number, maxPlayerCount: number) {
    this.id = id;
    this.users = new Map<string, GamePlayer>();
    this.towers = new Map<string, Tower>();
    this.tilemap = new Tilemap({ x: 16, y: 16 });
    this.monsterManager = new MonsterManager(this, this.tilemap);
    this.base = new Base(300, create(PosInfoSchema, { x: 16, y: 16 }), this);
    this.maxPlayerCount = maxPlayerCount;
    this.skillManager = new SkillManager(this);
  }

  /**
   * Base 좌표 생성 함수
   * @param {number} width - 가로 크기
   * @param {number} height - 세로 크기
   * @returns {Array} 좌표 배열
   */
  // baseSize(width, height) {
  //   const base = [];
  //   const halfWidth = Math.floor(width / 2);
  //   const halfHeight = Math.floor(height / 2);

  //   for (let y = -halfHeight; y <= halfHeight; y++) {
  //     for (let x = -halfWidth; x <= halfWidth; x++) {
  //       base.push({ x: x, y: y }); // 음수-양수 좌표 생성
  //     }
  //   }

  //   return base;
  // }

  getMonsters() {
    return this.monsterManager.getMonsters();
  }

  getTowers() {
    return this.towers;
  }

  getMonsterManager() {
    return this.monsterManager;
  }

  // 1. 방이 가득 찼는지 확인
  addplayer(player: GamePlayer) {
    if (this.users.size >= this.maxPlayerCount) {
      console.log('this.users.length: ' + this.users.size);

      console.log('this.maxPlayerCount: ' + this.maxPlayerCount);
      return false; // 방이 가득 참
    }
    if (this.users.get(player.session.getId()) != undefined) {
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
  enterRoom(player: GamePlayer) {
    // 1. 방이 가득 찼는지 확인
    // 2. 유저 추가
    const success = this.addplayer(player); // addPlayer: 방 객체에서 플레이어를 추가하는 메서드
    if (!success) {
      console.log(
        `플레이어를 방에 추가하지 못했습니다. roomId: ${this.id}, player: ${player.session.getId()}`,
      );
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '방 입장에 실패했습니다.');
    }
    // 3. 해당 유저에게 B2C_JoinRoomResponse 패킷 전송
    const enterRoomBuffer = createEnterRoom(player.session.getNextSequence());
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
      const obstaclePosInfos = this.generateObstacles(20);
      const gameStartBuffer = createGameStart(playerDatas, obstaclePosInfos);

      // 모든 유저에게 전송
      this.broadcast(gameStartBuffer);
      //몬스터 생성
      this.OnGameStart();
    }
  }

  /**---------------------------------------------
   * [장애물 생성]
   * @param {number} [obstacleCount=20]
   * @returns {PosInfo[]}
   */ //---------------------------------------------
  generateObstacles(obstacleCount = 40) {
    /** @type {Map<Vec2, PosInfo>} */
    let usedPositions = new Map();

    for (let i = 0; i < obstacleCount; ) {
      // 랜덤 좌표 생성
      const randomVec2 = { x: MathUtils.randomRangeInt(5, 26), y: MathUtils.randomRangeInt(2, 30) };
      const posInfo = create(PosInfoSchema, { x: randomVec2.x, y: randomVec2.y });

      // 타일이 있는 위치인지 확인
      if (this.tilemap.getTile(randomVec2) == Tile.None && !usedPositions.get(randomVec2)) {
        // 위치 기록
        usedPositions.set(randomVec2, posInfo);
        i += 1;
      }
    }

    const arr = Array.from(usedPositions.values());
    return arr;
  }

  public findCloseBuilding(pos: PosInfo): Tower | Base | null {
    let ret: Tower | Base | null = null;
    let best: number = Number.MAX_VALUE;

    // 타워 거리 계산
    for (let tower of this.towers) {
      if (tower[1]) {
        const dirX = pos.x - tower[1].getPos().x;
        const dirY = pos.y - tower[1].getPos().y;
        const dist: number = dirX * dirX + dirY * dirY; // 유클리드 거리 계산

        if (dist < best) {
          best = dist;
          ret = tower[1];
        }
      }
    }

    // base 거리 계산 (3x3 크기 고려)
    const baseCenter = this.base.getPos(); // Base 중앙 위치
    const baseSize = 3; // Base의 크기

    for (let offsetX = -Math.floor(baseSize / 2); offsetX <= Math.floor(baseSize / 2); offsetX++) {
      for (
        let offsetY = -Math.floor(baseSize / 2);
        offsetY <= Math.floor(baseSize / 2);
        offsetY++
      ) {
        const tileX = baseCenter.x + offsetX;
        const tileY = baseCenter.y + offsetY;
        const dirX = pos.x - tileX;
        const dirY = pos.y - tileY;
        const dist: number = dirX * dirX + dirY * dirY;

        if (dist < best) {
          best = dist;
          ret = this.base; // Base 객체를 반환
        }
      }
    }

    return ret;
  }

  OnGameStart() {
    console.log('OnGameStart Called');

    setTimeout(() => {
      this.users.forEach((player) => player.initCard());
      this.monsterManager.startSpawning();
    }, 500);

    this.gameLoopInterval = setInterval(() => {
      this.gameLoop();
    }, this.updateInterval);
  }

  getMonsterCount() {
    return this.monsterManager.getMonsterCount();
  }

  /*---------------------------------------------
    [이동 동기화]
  ---------------------------------------------*/
  handleMove(clientPacket: C2B_PlayerPositionUpdateRequest, session: BattleSession) {
    // 위치 검증
    if (!this.validatePosition(clientPacket.posInfo)) {
      console.log(`유효하지 않은 위치. ${clientPacket.posInfo}`);
      return;
    }
    const sendBuffer = createPosionUpdate(
      session.getId(),
      clientPacket.posInfo?.x,
      clientPacket.posInfo?.y,
    );

    this.broadcast(sendBuffer);
  }

  /**---------------------------------------------
   * [스킬 사용 동기화]
   * @param {Buffer} buffer - 스킬 사용 패킷 데이터
   ---------------------------------------------*/
  handleSkill(payload: any, session: BattleSession) {
    this.skillManager.handleSkill(payload, session);
  }

  /**---------------------------------------------
   * [타워 생성 동기화]
   * @param {Buffer} buffer - 타워 생성 패킷 데이터
   * @param {C2B_TowerBuildRequest} packet - 타워 생성 패킷 데이터
   ---------------------------------------------*/
  handleTowerBuild(packet: any, session: BattleSession) {
    console.log('handleTowerBuild');
    const { tower, ownerId, cardId } = packet;
    const user = this.users.get(session.getId());
    user?.useCard(cardId);

    // 1. 타워 데이터 존재 확인
    const towerData = assetManager.getTowerData(tower.prefabId);
    if (!towerData) {
      const failBuffer = createTowerBuildPacket(false, session.getNextSequence());
      session.send(failBuffer);
      return;
    }

    // 2. 타워 정보 저장
    const towerPosInfo = create(PosInfoSchema, {
      uuid: uuidv4(),
      x: packet.tower.towerPos.x,
      y: packet.tower.towerPos.y,
    });
    const newTower = new Tower(packet.tower.prefabId, towerPosInfo, this);
    this.addObject(newTower);
    this.towers.set(newTower.getId(), newTower);
    console.log(
      `타워생성 성공. towerId: ${newTower.getId()}, prefabId: ${newTower.getPrefabId()}, 위치: (${newTower.getPos()}`,
    );

    // 3. 타워 생성 성공 응답
    const responseBuffer = createTowerBuildPacket(true, session.getNextSequence());
    session.send(responseBuffer);

    // 4. 모든 클라이언트에게 타워 추가 알림
    const notificationBuffer = createTowerBuildNotificationPacket(
      {
        prefabId: packet.tower.prefabId,
        towerPos: towerPosInfo,
      },
      packet.ownerId,
      0,
    );
    this.broadcast(notificationBuffer);
  }

  /*---------------------------------------------
    [broadcast]
  ---------------------------------------------*/
  broadcast(buffer: Buffer) {
    for (const user of this.users) {
      user[1].session.send(buffer);
    }
  }

  /**---------------------------------------------
   * 이동 위치 검증
   * @param {PosInfo} position - 검증할 위치 정보
   * @returns {boolean} - 유효한 위치인지 여부
  ---------------------------------------------*/
  validatePosition(position: PosInfo | undefined) {
    if (position == undefined) return false;

    // 맵 범위 검증 (32x32 맵)
    if (position.x < 0 || position.x > 32 || position.y < 0 || position.y > 32) {
      console.log(`맵 범위 초과. 위치: ${position.x}, ${position.y}`);
      return false;
    }

    return true;
  }

  /**---------------------------------------------
   * [gameLoop]
   * 게임 루프 시작
  ---------------------------------------------*/
  gameLoop() {
    // 몬스터 업데이트
    this.monsterManager.updateMonsters();

    for (const [uuid, tower] of this.towers) {
      tower.attackTarget(Array.from(this.monsterManager.getMonsters().values()));
    }

    //베이스캠프 체력 0 일시 게임 종료
    if (this.checkBaseHealth()) {
      const endBuffer = createEndGame(false);
      this.broadcast(endBuffer);
      gameRoomManager.freeRoomId(this.id);
    }
    //유저가 0명이 되는 순간 게임 종료
  }

  /**---------------------------------------------
   * [addObject]
   * 오브젝트 추가
   * 대상: 몬스터, 타워, 투사체
   * 주의: 플레이어는 enterRoom으로 추가하기 
  ---------------------------------------------*/
  addObject(object: SkillUseMonster | Tower) {
    if (object instanceof SkillUseMonster) {
      this.monsterManager.addMonster(object);
      const sendBuffer = createAddObject(object);
      this.broadcast(sendBuffer);
    }
  }

  /**---------------------------------------------
   * [removeObject]
    - 오브젝트 제거
  ---------------------------------------------*/
  removeObject(uuid: string) {
    const object = this.findObject(uuid);

    if (object instanceof GamePlayer) {
      this.users.delete(uuid);
    } else if (object instanceof SkillUseMonster) {
      this.monsterManager.removeMonster(uuid);
    } else if (object instanceof Tower) {
      this.towers.delete(uuid);
    }
  }

  findObject(uuid: string) {
    if (this.users.has(uuid)) return this.users.get(uuid);
    if (this.monsterManager.getMonsters().has(uuid))
      return this.monsterManager.getMonsters().get(uuid);
    if (this.towers.has(uuid)) return this.towers.get(uuid);
    return null;
  }

  /*---------------------------------------------
    [addScore]
    - 점수를 추가하고 웨이브 상태를 확인
  ---------------------------------------------*/
  addScore(monsterScore: number) {
    this.score += monsterScore;

    if (this.score >= this.rewardScore) {
      // 여기에 카드 추가 로직
      this.users.forEach((player) => player.addRandomCard());
      console.log(`점수가 달성되어 카드가 지급됩니다.`);
      this.rewardScore += 10;
    }

    // 특정 점수 도달 시 웨이브 증가
    const scorePerWave = 10; // 웨이브 증가 기준 점수
    if (this.score >= this.wave * scorePerWave) {
      this.increaseWave();
    }
  }

  /*---------------------------------------------
    [increaseWave]
    - 웨이브를 증가시키고 몬스터를 강화
   ---------------------------------------------*/
  increaseWave() {
    this.wave += 1;
    console.log(`웨이브가 ${this.wave}단계로 올랐습니다!`);

    this.users.forEach((player) => player.addRandomCard());
    console.log(`웨이브가 올라가서 카드가 지급됩니다.`);

    // 강화 계수 증가
    this.monsterStatusMultiplier += 0.1;

    const increaseWaveBuffer = createIcreaseWave(true);

    this.broadcast(increaseWaveBuffer);
    if (this.wave % 5 === 0 && this.wave !== 1) {
      this.monsterManager.startSpawningElite();
      console.log('엘리트 몬스터 등장');
    }
  }

  checkBaseHealth() {
    return this.base.getHp() <= 0;
  }

  leaveRoom(playerId: string) {
    this.users.delete(playerId);
    console.log('플레이어 퇴장', playerId);
    console.log('현재 플레이어 수', this.users.size);
  }

  getCurrentUsersCount() {
    return this.users.size;
  }

  destroy() {
    this.monsterManager.stopSpawning();
    clearInterval(this.gameLoopInterval);
    this.monsterManager.destroy();
    this.towers.clear();
    this.users.clear();
  }
}
