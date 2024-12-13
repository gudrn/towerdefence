
import { B2C_GameEndNotification, B2G_GameStartNotification, B2G_GameStartNotificationSchema, B2G_JoinGameRoomResponseSchema } from 'src/protocol/room_pb';
import { Monster } from '../game/monster';
import { create } from '@bufbuild/protobuf';
import { GamePlayerData, GamePlayerDataSchema, PosInfo, PosInfoSchema, SkillDataSchema, TowerDataSchema } from "src/protocol/struct_pb";
import { Base } from "../game/base";
import { MonsterSpawner } from "./monsterSpanwner";
import { Tile, Tilemap } from "./tilemap";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { B2C_GameEndNotificationSchema, B2C_increaseWaveNotificationSchema } from "src/protocol/room_pb";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { Tower } from '../game/tower';
import { Vec2 } from 'ServerCore/utils/vec2';
import { B2C_UseSkillNotificationSchema } from 'src/protocol/skill_pb';
import { B2C_MonsterDeathNotificationSchema, B2C_MonsterHealthUpdateNotificationSchema, B2G_SpawnMonsterNotificationSchema } from 'src/protocol/monster_pb';
import { B2C_TowerBuildNotificationSchema, B2C_TowerBuildResponseSchema, B2C_TowerHealthUpdateNotificationSchema } from 'src/protocol/tower_pb';
import { gameRoomManager } from './gameRoomManager';
import { MathUtils } from 'src/utils/mathUtils';
import { BattleSession } from 'src/main/session/battleSession';
import { assetManager } from 'src/utils/assetManager';
import { v4 as uuidv4 } from "uuid";
import { GamePlayer } from '../game/gamePlayer';
import { B2G_PlayerPositionUpdateNotificationSchema, G2B_PlayerPositionUpdateRequest } from 'src/protocol/character_pb';
import { sessionManager } from 'src/server';
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
  private monsters: Map<string, Monster>;
  private towers: Map<string, Tower>;
  private maxPlayerCount: number;
  private tilemap: Tilemap;
  private base: Base;
  private monsterSpawner: MonsterSpawner;
  private updateInterval: number = 200; // 200ms 간격으로 업데이트

  private score: number = 0; // 현재 점수
  private rewardScore: number = 10;
  private wave = 1; // 현재 웨이브
  public monsterStatusMultiplier = 1; // 몬스터 강화 계수 (wave만으론 강화가 불가능한가요?) --12.06 조정현
  private gameLoopInterval: any = null; //gameLoop를 저장 후 방 제거 시 clear하기 위함

  constructor(id: number, maxPlayerCount: number) {
    this.id = id;
    this.users = new Map<string, GamePlayer>();
    this.monsters = new Map<string, Monster>();
    this.towers = new Map<string, Tower>();
    this.tilemap = new Tilemap({ x: 16, y: 16 });
    this.base = new Base(300, create(PosInfoSchema, { x: 16, y: 16 }), this);
    this.maxPlayerCount = maxPlayerCount;
    this.monsterSpawner = new MonsterSpawner(this);
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
          prefabId: user.playerData.prefabId
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

  /*---------------------------------------------
  [길찾기]
---------------------------------------------*/
  public findPath(src: Vec2, dest: Vec2){
    const path: Vec2[] = [];

    const pq: PQNode[] = [];
    const best: Map<string, number> = new Map();
    const parent: Map<string, Vec2> = new Map();

    const key = (vec: Vec2) => `${vec.x},${vec.y}`;
    // 초기값 설정
    {
        const cost = Math.abs(dest.y - src.y) + Math.abs(dest.x - src.x);
        pq.push({ cost, pos: src });
        best.set(key(src), cost);
        parent.set(key(src), src);
    }
    const directions = [
      { x: 0, y: -1 }, // 북
      { x: 0, y: 1 },  // 남
      { x: -1, y: 0 }, // 서
      { x: 1, y: 0 },  // 동
      { x: -1, y: -1 }, // 북서
      { x: 1, y: -1 },  // 북동
      { x: -1, y: 1 },  // 남서
      { x: 1, y: 1 },   // 남동
    ];

    let found = false;
    
    while (pq.length > 0) {
        // 우선순위 큐에서 최소 비용 노드 선택
        pq.sort((a, b) => a.cost - b.cost);
        const node = pq.shift()!;

        const nodeKey = key(node.pos);

        // 더 짧은 경로를 뒤늦게 찾았다면 스킵
        if ((best.get(nodeKey) ?? Infinity) < node.cost) continue;

        // 목적지에 도착했으면 종료
        if (node.pos.x === dest.x && node.pos.y === dest.y) {
            found = true;
            break;
        }

        // 방문
        for (const dir of directions) {
            const nextPos: Vec2 = {
                x: node.pos.x + dir.x,
                y: node.pos.y + dir.y,
            };

            const nextKey = key(nextPos);

            //대각선 이동 시  막혀있는 곳은 없는지 검사
            if (dir.x !== 0 && dir.y !== 0) {
              const adjacent1 = { x: node.pos.x + dir.x, y: node.pos.y };
              const adjacent2 = { x: node.pos.x, y: node.pos.y + dir.y };

              if (!this.canGo(adjacent1) || !this.canGo(adjacent2)) {
                continue; // 양쪽 경로 중 하나라도 막혀 있으면 대각선 이동 불가
              }
            }
            
            if (!this.canGo(nextPos)) continue;

            const cost = Math.abs(dest.y - nextPos.y) + Math.abs(dest.x - nextPos.x);
            const bestValue = best.get(nextKey);

            if (bestValue !== undefined && bestValue <= cost) continue;

            // 예약 진행
            best.set(nextKey, cost);
            pq.push({ cost, pos: nextPos });
            parent.set(nextKey, node.pos);
        }
    }

    if (!found) {
        let bestScore = Number.MAX_VALUE;

        for (const [posKey, score] of best.entries()) {
            const pos = this.parseKey(posKey);

            // 동점이라면 최초 위치에서 가장 덜 이동하는 쪽으로
            if (bestScore === score) {
                const dist1 = Math.abs(dest.x - src.x) + Math.abs(dest.y - src.y);
                const dist2 = Math.abs(pos.x - src.x) + Math.abs(pos.y - src.y);
                if (dist1 > dist2) dest = pos;
            } else if (bestScore > score) {
                dest = pos;
                bestScore = score;
            }
        }
    }

    let pos = dest;
    while (true) {
        path.push(pos);

        const parentPos = parent.get(key(pos));
        if (!parentPos || (pos.x === parentPos.x && pos.y === parentPos.y)) break;

        pos = parentPos;
    }

    path.reverse();
    return path;
  }

  public findCloseBuilding(pos: PosInfo) {
    let ret: Tower | Base | null = null;
    let best: number = Number.MAX_VALUE;

    // 타워 거리 계산
    for (let tower of this.towers) {
        if (tower[1]) {
            const dirX = pos.x - tower[1].getPos().x;
            const dirY = pos.y - tower[1].getPos().y;
            const dist: number = (dirX * dirX) + (dirY * dirY); // 유클리드 거리 계산

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
        for (let offsetY = -Math.floor(baseSize / 2); offsetY <= Math.floor(baseSize / 2); offsetY++) {
            const tileX = baseCenter.x + offsetX;
            const tileY = baseCenter.y + offsetY;
            const dirX = pos.x - tileX;
            const dirY = pos.y - tileY;
            const dist: number = (dirX * dirX) + (dirY * dirY);

            if (dist < best) {
                best = dist;
                ret = this.base; // Base 객체를 반환
            }
        }
    }

    return ret;
  }

  private parseKey(key: string) {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }

  public canGo(pos: Vec2): boolean;
  public canGo(pos: PosInfo): boolean {
    const tile = this.tilemap.getTile(pos);
    return tile !== null;
  }

  private onGameStart() {
    console.log('OnGameStart Called');

    setTimeout(() => {
      this.users.forEach((player) => player.initCard());
      this.monsterSpawner.startSpawning();
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
    if (position.x < 0 || position.x > 32 || position.y < 0 || position.y > 32) {
      console.log(`맵 범위 초과. 위치: ${position.x}, ${position.y}`);
      return false;
    }

    return true;
  }

  /*---------------------------------------------
   [게임 루프 시작]
  ---------------------------------------------*/
  private gameLoop() {
    //몬스터(Monster) 업데이트
    for (const [uuid, monster] of this.monsters) {
      monster.update();
    }

    // // 타워(Tower) 업데이트
    // for (const [uuid, tower] of this.towers) {
    //   tower.update();
    // }

    for (const [uuid, tower] of this.towers) {
      tower.attackTarget(Array.from(this.monsters.values()));
    }

    //베이스캠프 체력 0 일시 게임 종료
    // if (this.checkBaseHealth()) {
    //   const endNotification = create(B2C_GameEndNotificationSchema, {
    //     isSuccess: false,
    //   });
    //   const endBuffer = PacketUtils.SerializePacket(
    //     endNotification,
    //     B2C_GameEndNotificationSchema,
    //     ePacketId.B2C_GameEndNotification,
    //     0,
    //   );

    //   this.broadcast(endBuffer);
    //   gameRoomManager.freeRoomId(this.id);
    // }
    //유저가 0명이 되는 순간 게임 종료
  }

  /**---------------------------------------------
   * 오브젝트 추가
   * 대상: 몬스터, 타워, 투사체
   * 주의: 플레이어는 enterRoom으로 추가하기 
   ---------------------------------------------*/
   addObject(object: Monster | Tower) {
    if (object instanceof Monster) {
      this.monsters.set(object.getId(), object);

      const packet = create(B2G_SpawnMonsterNotificationSchema, {
        posInfo: object.getPos(),
        prefabId: object.getPrefabId(),
        roomId: this.id
      });

      console.log("방 아이디는", this.id);
      const sendBuffer: Buffer = PacketUtils.SerializePacket(
        packet,
        B2G_SpawnMonsterNotificationSchema,
        ePacketId.B2G_SpawnMonsterNotification,
        0,
      );
      this.broadcast(sendBuffer);
    }
  }

  /**---------------------------------------------
   * 오브젝트 제거
   ---------------------------------------------*/
  removeObject(uuid: string) {
    const object = this.findObject(uuid);

    if (object instanceof GamePlayer) {
      this.users.delete(uuid);
    } else if (object instanceof Monster) {
      this.monsters.delete(uuid);
    } else if (object instanceof Tower) {
      this.towers.delete(uuid);
    }
  }

  findObject(uuid: string) {
    if (this.users.has(uuid)) {
      return this.users.get(uuid);
    }
    if (this.monsters.has(uuid)) {
      return this.monsters.get(uuid);
    }
    if (this.towers.has(uuid)) {
      return this.towers.get(uuid);
    }
    return null;
  }

  public broadcast(buffer: Buffer) {
    //게이트웨이 서버가 2개라면 broadcast하는 방식이 바뀔텐데
    //아마도 redis에서 roomData를 가져와 userId[]를 가져온 뒤 broadcast
    //너무 비싼거 아닌가??

    const gatewaySession = sessionManager.getRandomSession();
    if(gatewaySession == null) {
      throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, "게이트웨이 세션을 찾을 수 없습니다.");
    }

    gatewaySession.send(buffer);
  }
}
