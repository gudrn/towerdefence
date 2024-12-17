
import { B2C_GameEndNotification, B2G_GameStartNotification, B2G_GameStartNotificationSchema, B2G_IncreaseWaveNotificationSchema, B2G_JoinGameRoomResponseSchema } from 'src/protocol/room_pb';
import { create } from '@bufbuild/protobuf';
import { GamePlayerData, GamePlayerDataSchema, PosInfo, PosInfoSchema, SkillDataSchema, TowerDataSchema } from "src/protocol/struct_pb";
import { Base } from "../game/base";
import { MonsterSpawner } from "./monsterSpanwner";
import { Tile, Tilemap } from "./tilemap";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { Tower } from '../game/tower';
import { Vec2 } from 'ServerCore/utils/vec2';
import { B2G_SpawnMonsterNotificationSchema } from 'src/protocol/monster_pb';
import { gameRoomManager } from './gameRoomManager';
import { MathUtils } from 'src/utils/mathUtils';
import { BattleSession } from 'src/main/session/battleSession';
import { assetManager } from 'src/utils/assetManager';
import { v4 as uuidv4 } from "uuid";
import { GamePlayer } from '../game/gamePlayer';
import { B2G_PlayerPositionUpdateNotificationSchema, G2B_PlayerPositionUpdateRequest, G2B_PlayerUseAbilityRequest } from 'src/protocol/character_pb';
import { sessionManager } from 'src/server';
import { B2G_TowerBuildNotificationSchema, G2B_TowerBuildRequest } from 'src/protocol/tower_pb';
import { SkillManager } from './skillManager';
import { MonsterManager } from './monsterManager';
import { SkillUseMonster } from '../game/skillUseMonster';
import { G2B_UseSkillRequest } from 'src/protocol/skill_pb';

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


  /*---------------------------------------------
  [방 입장]
  // 1. 방이 가득 찼는지 확인
  // 2. 유저 추가
  // 3. 해당 유저에게 B2C_JoinRoomResponse 패킷 전송
  // 4. 모든 인원이 들어왔다면 B2C_GameStartNotification 패킷 전송
---------------------------------------------*/
  public enterRoom(player: GamePlayer, session: BattleSession) {
    // 1. 방이 가득 찼는지 확인
    if (this.users.size >= this.maxPlayerCount) {
      throw new CustomError(ErrorCodes.ROOM_FULL, "방이 가득 참");
    }

    // 2. 유저 추가
    this.users.set(player.playerData.position!.uuid, player);
    console.log(`유저가 방에 입장했습니다. 현재 인원: ${this.users.size}/${this.maxPlayerCount}`);

    // 3. 해당 유저에게 B2C_JoinRoomResponse 패킷 전송
    const enterRoomPacket = create(B2G_JoinGameRoomResponseSchema, {
      isSuccess: true
    });

    const enterRoomBuffer: Buffer = PacketUtils.SerializePacket(
      enterRoomPacket,
      B2G_JoinGameRoomResponseSchema,
      ePacketId.B2G_JoinGameRoomResponse,
      0
    );
    session.send(enterRoomBuffer);
    
    // 4. 모든 인원이 들어왔다면 B2C_GameStart 패킷 전송
    if (this.users.size === this.maxPlayerCount) {
      console.log('모든 유저가 입장하였습니다. 게임을 시작합니다.');

      // 유저의 스폰 위치 부여
      const playerDatas: GamePlayerData[] = [];

      // Map의 값(value)을 배열로 변환하여 순회
      const usersArray = Array.from(this.users.values());
      for (let i = 0; i < usersArray.length; i++) {
        const user = usersArray[i];
        const spawnPoint = GameRoom.spawnCoordinates[i]; // 좌표 목록에서 순차적으로 할당

        const posInfo = create(PosInfoSchema, {
          uuid: user.playerData.position?.uuid,
          x: spawnPoint.x,
          y: spawnPoint.y
        });

        const gamePlayerData = create(GamePlayerDataSchema, {
          position: posInfo,
          nickname: user.playerData.nickname,
          prefabId: user.playerData.prefabId,
          coolDown: user.playerData.coolDown
        });

        playerDatas.push(gamePlayerData);
      }

      const obstaclePosInfos = this.generateObstacles(20);
      // B2C_GameStartNotification 패킷 생성
      const gameStartPacket: B2G_GameStartNotification = create(B2G_GameStartNotificationSchema, {
        roomId: this.id,
        playerDatas,
        obstaclePosInfos
      });

      const gameStartBuffer: Buffer = PacketUtils.SerializePacket(
        gameStartPacket,
        B2G_GameStartNotificationSchema,
        ePacketId.B2G_GameStartNotification,
        0
      );

      // 모든 유저에게 전송
      session.send(gameStartBuffer);

      //몬스터 생성
      this.onGameStart();
    }
  }

  /*---------------------------------------------
   [장애물 생성]
  ---------------------------------------------*/
  generateObstacles(obstacleCount = 40) {
    /** @type {Map<Vec2, PosInfo>} */
    let usedPositions = new Map();

    for (let i = 0; i < obstacleCount;) {
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
    console.log(arr);
    console.log(arr.length);
    return arr;
  }

  private onGameStart() {
    console.log('OnGameStart Called');

    setTimeout(() => {
      this.users.forEach((player) => player.initCard());
      this.monsterManager.startSpawning();
    }, 500);

    this.gameLoopInterval = setInterval(() => {
      this.gameLoop();
    }, this.updateInterval);
  }

  /*---------------------------------------------
    [이동 동기화]
---------------------------------------------*/
  public handleMove(clientPacket: G2B_PlayerPositionUpdateRequest, session: BattleSession) {
    // 위치 검증
    if (!this.validatePosition(clientPacket.posInfo)) {
      console.log(`유효하지 않은 위치. ${clientPacket.posInfo}`);
      return;
    }

    const packet = create(B2G_PlayerPositionUpdateNotificationSchema, {
      posInfo: clientPacket.posInfo,
      roomId: clientPacket.roomId,
    });

    if (clientPacket.posInfo == undefined) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, 'ㅇㅇ');
    }

    const user = this.users.get(clientPacket.posInfo?.uuid);
    if (user == undefined) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, 'ㅇㅇ');
    }

    //유저 위치 최신화
    user.playerData.position = clientPacket.posInfo;
    
    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2G_PlayerPositionUpdateNotificationSchema,
      ePacketId.B2G_PlayerPositionUpdateNotification,
      0,
    );
    this.broadcast(sendBuffer);
  }

  /*---------------------------------------------
   [이동 위치 검증]
  ---------------------------------------------*/
  private validatePosition(position: PosInfo | undefined) {
    if(position == undefined)
      return false;

    // 맵 범위 검증 (32x32 맵)
    //야매...(32가 맞지만 일단 임시로 34로 설정)
    if (position.x < 0 || position.x > 34 || position.y < 0 || position.y > 34) {
      console.log(`맵 범위 초과. 위치: ${position.x}, ${position.y}`);
      return false;
    }

    return true;
  }

  /*---------------------------------------------
   [게임 루프 시작]
  ---------------------------------------------*/
  private gameLoop() {
    if(this.isGameOver()) {
      this.gameOver();
      return;
    }
    
    // 몬스터 업데이트
    this.monsterManager.updateMonsters();

    // 타워 업데이트
    for (const [uuid, tower] of this.towers) {
      tower.update();
    }
    

    //베이스캠프 체력 0 일시 게임 종료
    // if (this.checkBaseHealth()) {
    //   const endBuffer = createEndGame(false);
    //   this.broadcast(endBuffer);
    //   gameRoomManager.deleteGameRoom(this.id);
    // }
    //유저가 0명이 되는 순간 게임 종료
  }

  /**---------------------------------------------
   * 오브젝트 추가
   * 대상: 몬스터, 타워, 투사체
   * 주의: 플레이어는 enterRoom으로 추가하기 
   ---------------------------------------------*/
   addObject(object: SkillUseMonster | Tower) {
    if (object instanceof SkillUseMonster) {
      this.monsterManager.addMonster(object);

      const packet = create(B2G_SpawnMonsterNotificationSchema, {
        posInfo: object.getPos(),
        prefabId: object.getPrefabId(),
        maxHp: object.maxHp,
        roomId: this.id
      });

      //console.log("방 아이디는", this.id);
      //console.log(object.getPrefabId, object.maxHp);
      const sendBuffer: Buffer = PacketUtils.SerializePacket(
        packet,
        B2G_SpawnMonsterNotificationSchema,
        ePacketId.B2G_SpawnMonsterNotification,
        0,
      );
      this.broadcast(sendBuffer);
    }
  }

  /*---------------------------------------------
   [오브젝트 제거]
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

   /*---------------------------------------------
   [오브젝트 찾기]
   ---------------------------------------------*/
  findObject(uuid: string) {
    if (this.users.has(uuid)) return this.users.get(uuid);
    if (this.monsterManager.getMonsters().has(uuid))
      return this.monsterManager.getMonsters().get(uuid);
    if (this.towers.has(uuid)) return this.towers.get(uuid);
    return null;
  }

  // 타워 생성 동기화
  handleTowerBuild(packet: G2B_TowerBuildRequest, session: BattleSession) {
    const { tower, ownerId, cardId } = packet;
    const user = this.users.get(session.getId());
    //user?.useCard(cardId); 나중에 카드까지 동기화 후 사용할 코드임 삭제 하지마십시오.

    //1. 타워 데이터 존재 확인
    if(packet.tower == undefined) {
      console.log("[handleTowerBuild] 타워 데이터가 유효하지 않습니다.");
      throw new CustomError(ErrorCodes.SOCKET_ERROR, "유효하지 않은 타워");
    }
    const towerData = assetManager.getTowerData(packet.tower.prefabId);
    if (!towerData) {
      throw new CustomError(ErrorCodes.SOCKET_ERROR, "유효하지 않은 타워");
    }

    // 2. 타워 정보 저장
    if(packet.tower.towerPos == undefined) {
      console.log("[handleTowerBuild] towerPos가 유효하지 않습니다.");
      throw new CustomError(ErrorCodes.SOCKET_ERROR, "유효하지 않은 towerPos");
    }

    const towerPosInfo = create(PosInfoSchema, {
      uuid: uuidv4(),
      x: packet.tower.towerPos.x,
      y: packet.tower.towerPos.y,
    });
    const newTower = new Tower(packet.tower.prefabId, towerPosInfo, this);
    this.towers.set(newTower.getId(), newTower);
    // 3. 타워 생성 성공 응답
    

    // 4. 모든 클라이언트에게 타워 추가 알림
    const towerBuildNotificationPacket = create(B2G_TowerBuildNotificationSchema, {
      tower: create(TowerDataSchema, {
        prefabId: packet.tower.prefabId,
        towerPos: towerPosInfo
      }),
      ownerId: ownerId,
      maxHp: newTower.maxHp,
      roomId:this.id,
  });

  const towerBuildNotificationBuffer = PacketUtils.SerializePacket(
      towerBuildNotificationPacket,
      B2G_TowerBuildNotificationSchema,
      ePacketId.B2G_TowerBuildNotification,
      0,
    );
    this.broadcast(towerBuildNotificationBuffer);
    
    // 버프 적용
    if (newTower.getPrefabId() === 'BuffTower') {
      newTower.buffTowersInRange();
    } else if (newTower.isBuffTowerInRange()) {
      newTower.applyAttackBuff();
    }
  }

  public broadcast(buffer: Buffer) {
    //게이트웨이 서버가 2개라면 broadcast하는 방식이 바뀔텐데
    //아마도 redis에서 roomData를 가져와 userId[]를 가져온 뒤 broadcast...?

    const gatewaySession = sessionManager.getRandomSession();
    if(gatewaySession == null) {
      throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, "게이트웨이 세션을 찾을 수 없습니다.");
    }
    gatewaySession.send(buffer);
  }

  /*---------------------------------------------
    [addScore]
    - 점수를 추가하고 웨이브 상태를 확인
  ---------------------------------------------*/
  public addScore(monsterScore: number) {
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

  private increaseWave() {
    this.wave += 1;

    this.users.forEach((player) => player.addRandomCard());

    // 강화 계수 증가
    this.monsterStatusMultiplier += 0.05;
    if(this.wave % 10 == 0){
      this.monsterManager.increaseWave();
    }
    const increaseWavePacket = create(B2G_IncreaseWaveNotificationSchema, {
      isSuccess:  true,
      roomId: this.id
    });
  
    const sendBuffer = PacketUtils.SerializePacket(
      increaseWavePacket,
      B2G_IncreaseWaveNotificationSchema,
      ePacketId.B2G_IncreaseWaveNotification,
      0, //수정 부분
    );

    this.broadcast(sendBuffer);

    if (this.wave % 5 === 0 && this.wave !== 1) {
      this.monsterManager.startSpawningElite();
    }
  }

  isGameOver() {
    return this.base.getHp() <= 0;
  }

  // leaveRoom(playerId: string) {
  //   this.users.delete(playerId);
  //   console.log('플레이어 퇴장', playerId);
  //   console.log('현재 플레이어 수', this.users.size);
  // }

  // getCurrentUsersCount() {
  //   return this.users.size;
  // }

  private gameOver(){
      console.log("게임 오버");
      this.monsterManager.stopSpawning();
      clearInterval(this.gameLoopInterval);
      this.monsterManager.destroy();
      this.towers.clear();
      this.users.clear();
  }


  /*---------------------------------------------
   [스킬 카드 사용]
  ---------------------------------------------*/
  public handleSkill(packet: G2B_UseSkillRequest, session: BattleSession) {
    this.skillManager.handleSkill(packet, session);
  }

  /*---------------------------------------------
   [캐릭터 고유 능력 사용]
  ---------------------------------------------*/
   handleAbility(packet: G2B_PlayerUseAbilityRequest, session: BattleSession) {
    if(packet.position?.uuid == undefined){
      throw new CustomError(ErrorCodes.MISSING_FIELDS, "플레이어 데이터가 없음");
    }

    const user = this.users.get(packet.position?.uuid);

    if (user == undefined) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, ' 데이터가 없음.');
    }
    user.useAbility();
  }

  public findCloseBuilding(pos: PosInfo) {
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

  public getMonsters() {
    return this.monsterManager.getMonsters();
  }
  
  getTowers() {
    return this.towers;
  }

  getMonsterManager() {
    return this.monsterManager;
  }
}
