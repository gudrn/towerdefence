import { B2C_GameEndNotification } from 'src/protocol/room_pb';
import { Monster } from '../game/monster';
import { create } from '@bufbuild/protobuf';
import { GamePlayerDataSchema, PosInfo, PosInfoSchema, SkillDataSchema, TowerDataSchema } from "src/protocol/struct_pb";
import { Base } from "../game/base";
import { MonsterSpawner } from "./monsterSpanwner";
import { Tile, Tilemap } from "./tilemap";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { B2C_GameEndNotificationSchema, B2C_GameStartNotificationSchema, B2C_increaseWaveNotificationSchema, B2C_JoinRoomRequestSchema } from "src/protocol/room_pb";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { Tower } from '../game/tower';
import { Vec2 } from 'ServerCore/utils/vec2';
import { B2C_UseSkillNotificationSchema } from 'src/protocol/skill_pb';
import { B2C_MonsterDeathNotificationSchema, B2C_MonsterHealthUpdateNotificationSchema, B2C_SpawnMonsterNotificationSchema } from 'src/protocol/monster_pb';
import { B2C_TowerBuildNotificationSchema, B2C_TowerBuildResponseSchema, B2C_TowerHealthUpdateNotificationSchema } from 'src/protocol/tower_pb';
import { gameRoomManager } from './gameRoomManager';
import { MathUtils } from 'src/utils/mathUtils';
import { BattleSession } from 'src/main/session/battleSession';
import { assetManager } from 'src/utils/assetManager';
import { B2C_PlayerPositionUpdateNotificationSchema, C2B_PlayerPositionUpdateRequest } from 'src/protocol/character_pb';
import { v4 as uuidv4 } from "uuid";
import { GamePlayer } from '../game/gamePlayer';
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
    return this.monsters;
  }

  getTowers() {
    return this.towers;
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
      console.log(`플레이어를 방에 추가하지 못했습니다. roomId: ${this.id}, player: ${player.session.getId()}`);
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

      const obstaclePosInfos = this.generateObstacles(20);
      // B2C_GameStartNotification 패킷 생성
      const gameStartPacket = create(B2C_GameStartNotificationSchema, {
        playerDatas,
        obstaclePosInfos,
      });

      const gameStartBuffer = PacketUtils.SerializePacket(
        gameStartPacket,
        B2C_GameStartNotificationSchema,
        ePacketId.B2C_GameStartNotification,
        0,
      );

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
  public findPath(src: Vec2, dest: Vec2): Vec2[] | null {
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

  public findCloseBuilding(pos: PosInfo): Tower | Base | null {
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

  private parseKey(key: string): Vec2 {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }

  public canGo(pos: Vec2): boolean;
  public canGo(pos: PosInfo) {
    const tile = this.tilemap.getTile(pos);
    return tile !== null;
  }

  OnGameStart() {
    console.log('OnGameStart Called');

    setTimeout(() => {
      this.users.forEach((player) => player.initCard());
      this.monsterSpawner.startSpawning();
    }, 500);

    this.gameLoopInterval = setInterval(() => {
      this.gameLoop();
    }, this.updateInterval);
  }

  getMonsterCount() {
    return this.monsters.size;
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

    const packet = create(B2C_PlayerPositionUpdateNotificationSchema, {
      posInfo: create(PosInfoSchema, {
        uuid: session.getId(),
        x: clientPacket.posInfo?.x,
        y: clientPacket.posInfo?.y,
      }),
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2C_PlayerPositionUpdateNotificationSchema,
      ePacketId.B2C_PlayerPositionUpdateNotification,
      0,
    );
    this.broadcast(sendBuffer);
  }

  /**---------------------------------------------
   * [스킬 사용 동기화]
   * @param {Buffer} buffer - 스킬 사용 패킷 데이터
   ---------------------------------------------*/
  handleSkill(payload:any, session: BattleSession) {
    const { prefabId, skillPos } = payload.skill;
    const user: GamePlayer | undefined = this.users.get(session.getId());
    let monstersInRangeForOrbital:any[]=[];
    let towerToHeal:[string,Tower]| undefined;
    // 카드사용
    user?.useCard(payload.cardId);
    console.log(user?.getCardList());
    console.log('skill: ', prefabId);
    console.log('skillPos: ', skillPos);
    // 카드 데이터 가져옴
    const skill = assetManager.getSkillsDataByPrefabId(prefabId);

    const applyDamageToMonsters = (monsters:any, damage:any) => {
      monsters.forEach((monster:any) => {
        monster.hp -= damage;
        if (monster.hp <= 0) {
          monster.onDeath();
        }
      });
    };

    switch (skill?.prefabId) {
      case 'OrbitalBeam': // 궤도 폭격
        for (const [key, monster] of this.monsters) {
          const distance = Math.sqrt(
            
            Math.pow(monster.getPos().x - skillPos.x, 2) + Math.pow(monster.getPos().y - skillPos.y, 2),
          );
          if (distance <= skill.attackRange) {
            monstersInRangeForOrbital.push(monster);
          }
        }
        applyDamageToMonsters(monstersInRangeForOrbital, skill.attackDamage);
        break;
      case 'CARPET_BOMBING': // 융단 폭격(구현예정)
        // monstersInRangeForOrbital = this.monsters.filter((monster) => {
        //   // 점과 직선 사이의 거리를 구하는 공식
        //   // |Ax + By + C| / sqrt(A^2 + B^2)
        //   // 여기서 A = posInfo.y - 0, B = -(posInfo.x - 0), C = 0
        //   const distance =
        //     Math.abs(
        //       (skillPos.y - 0) * monster.pos.x -
        //       (skillPos.x - 0) * monster.pos.y +
        //       (skillPos.x * 0 - skillPos.y * 0),
        //     ) / Math.sqrt(Math.pow(skillPos.y - 0, 2) + Math.pow(skillPos.x - 0, 2));
        //   return distance <= skill?.attackRange;
        // });
        // applyDamageToMonsters(monstersInRangeForOrbital, skill.attackDamage);
        break;
      case 'TowerRepair': // 타워 힐
        for (const [key, tower] of this.towers) {
          if (tower.pos.x === skillPos.x && tower.pos.y === skillPos.y) {
            towerToHeal = [key, tower];
            break;
          }
        }
        if (towerToHeal) {
          towerToHeal[1].hp += skill.heal;
          if (towerToHeal[1].hp > towerToHeal[1].maxHp) {
            towerToHeal[1].hp = towerToHeal[1].maxHp;
          }
          console.log(towerToHeal);
        } else {
          console.log('해당 위치에 타워가 존재하지 않음');
          //user?.reAddCardOnFailure(prefabId);
          return;
        }
        const towerPacket = create(B2C_TowerHealthUpdateNotificationSchema, {
          towerId: towerToHeal[0],
          hp: towerToHeal[1].hp,
          maxHp: towerToHeal[1].maxHp,
        });
    
        const towerBuffer = PacketUtils.SerializePacket(
          towerPacket,
          B2C_TowerHealthUpdateNotificationSchema,
          ePacketId.B2C_TowerHealthUpdateNotification,
          0,
        );
        this.broadcast(towerBuffer);
        
        break;
      default:
        return;
    }

    const skilldata = create(SkillDataSchema, {
      prefabId: prefabId,
      skillPos: create(PosInfoSchema, {
        x: skillPos.x,
        y: skillPos.y,
      }),
    });
    //스킬 공격 알림
    const notification = create(B2C_UseSkillNotificationSchema, {
      skill: skilldata,
    });

    const notificationBuffer = PacketUtils.SerializePacket(
      notification,
      B2C_UseSkillNotificationSchema,
      ePacketId.B2C_UseSkillNotification,
      0,
    );

    this.broadcast(notificationBuffer);

    // 공격 스킬일때만 몬스터 hp 동기화
    if (skill.type === 'Attack' && monstersInRangeForOrbital.length > 0) {
      // 2. 클라이언트에 공격 패킷 전송
      for (const monster of monstersInRangeForOrbital) {
        if (monster.hp <= 0) {
          const mopnsterDeathPacket = create(B2C_MonsterDeathNotificationSchema, {
            monsterId: monster.getId(),
            score: monster.score,
          });

          const monsterDeathBuffer = PacketUtils.SerializePacket(
            mopnsterDeathPacket,
            B2C_MonsterDeathNotificationSchema,
            ePacketId.B2C_MonsterDeathNotification,
            0, //수정 부분
          );

          this.broadcast(monsterDeathBuffer);
        }

        const attackPacket = create(B2C_MonsterHealthUpdateNotificationSchema, {
          monsterId: monster.getId(),
          hp: monster.hp,
          maxHp: monster.maxHp,
        });

        const attackBuffer = PacketUtils.SerializePacket(
          attackPacket,
          B2C_MonsterHealthUpdateNotificationSchema,
          ePacketId.B2C_MonsterHealthUpdateNotification,
          0,
        );
        this.broadcast(attackBuffer);
      }
    } 
  }

  /**---------------------------------------------
   * [타워 생성 동기화]
   * @param {Buffer} buffer - 타워 생성 패킷 데이터
   * @param {C2B_TowerBuildRequest} packet - 타워 생성 패킷 데이터
   ---------------------------------------------*/
  handleTowerBuild(packet:any, session: BattleSession) {
    console.log('handleTowerBuild');
    const { tower, ownerId, cardId } = packet;
    const user = this.users.get(session.getId());
    user?.useCard(cardId);

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
    const successResponse = create(B2C_TowerBuildResponseSchema, {
      isSuccess: true,
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
      tower: create(TowerDataSchema, {
        prefabId: packet.tower.prefabId,
        towerPos: towerPosInfo,
      }),
      ownerId: packet.ownerId,
    });

    console.log('-------------');
    console.log('ㅇㅇ');
    console.log(notification.tower);
    console.log(notification.ownerId);
    console.log('-------------');
    const notificationBuffer = PacketUtils.SerializePacket(
      notification,
      B2C_TowerBuildNotificationSchema,
      ePacketId.B2C_TowerBuildNotification,
      session.getNextSequence(),
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
    if(position == undefined)
      return false;

    // 맵 범위 검증 (32x32 맵)
    if (position.x < 0 || position.x > 32 || position.y < 0 || position.y > 32) {
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

    // // 타워(Tower) 업데이트
    // for (const [uuid, tower] of this.towers) {
    //   tower.update();
    // }

    for (const [uuid, tower] of this.towers) {
      tower.attackTarget(Array.from(this.monsters.values()));
    }

    //베이스캠프 체력 0 일시 게임 종료
    if (this.checkBaseHealth()) {
      const endNotification = create(B2C_GameEndNotificationSchema, {
        isSuccess: false,
      });
      const endBuffer = PacketUtils.SerializePacket(
        endNotification,
        B2C_GameEndNotificationSchema,
        ePacketId.B2C_GameEndNotification,
        0,
      );

      this.broadcast(endBuffer);
      gameRoomManager.freeRoomId(this.id);
    }
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

      const packet = create(B2C_SpawnMonsterNotificationSchema, {
        posInfo: object.getPos(),
        prefabId: object.getPrefabId(),
      });

      const sendBuffer: Buffer = PacketUtils.SerializePacket(
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


  /*---------------------------------------------
    [addScore]
    - 점수를 추가하고 웨이브 상태를 확인
---------------------------------------------*/
  addScore(monsterScore: number) {
    this.score += monsterScore;

    if (this.score >= this.rewardScore) {
      // 여기에 카드 추가 로직
      this.users.forEach((player) => player.addRandomCard());
      console.log(`점수가 달성되어 카드가 지급됩니다.`)
      this.rewardScore += 10
    }

    // 특정 점수 도달 시 웨이브 증가
    const scorePerWave = 10; // 웨이브 증가 기준 점수
    if (this.score >= this.wave * scorePerWave) {
      this.increaseWave();
    }
  }

  /**
   * 웨이브를 증가시키고 몬스터를 강화
   */
  increaseWave() {
    this.wave += 1;
    console.log(`웨이브가 ${this.wave}단계로 올랐습니다!`);

    this.users.forEach((player) => player.addRandomCard());
    console.log(`웨이브가 올라가서 카드가 지급됩니다.`)

    // 강화 계수 증가
    this.monsterStatusMultiplier += 0.1;

    const increaseWavePacket = create(B2C_increaseWaveNotificationSchema, {
      isSuccess: true,
    });

    const increaseWaveBuffer = PacketUtils.SerializePacket(
      increaseWavePacket,
      B2C_increaseWaveNotificationSchema,
      ePacketId.B2C_increaseWaveNotification,
      0, //수정 부분
    );

    this.broadcast(increaseWaveBuffer);
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
      this.monsterSpawner.stopSpawning();
      clearInterval(this.gameLoopInterval);
      this.monsters.clear();
      this.towers.clear();
      this.users.clear();
  }
}
