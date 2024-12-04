import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { assetManager } from '../../utils/assetManager.js';
import { GamePlayer } from '../../contents/game/gamePlayer.js';
import {
  B2C_GameStartNotificationSchema,
  B2C_JoinRoomRequestSchema,
} from '../../protocol/room_pb.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { fromBinary, create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { MonsterSpawner } from './monsterSpanwner.js';
import {
  GamePlayerDataSchema,
  PosInfoSchema,
  SkillDataSchema,
  TowerDataSchema,
} from '../../protocol/struct_pb.js';
import { Monster } from '../game/monster2.js';
import { B2C_SpawnMonsterNotificationSchema } from '../../protocol/monster_pb.js';
import {
  B2C_PlayerPositionUpdateNotificationSchema,
  C2B_PlayerPositionUpdateRequestSchema,
} from '../../protocol/character_pb.js';
import {
  B2C_TowerBuildNotificationSchema,
  B2C_TowerBuildResponseSchema,
} from '../../protocol/tower_pb.js';
import { v4 as uuidv4 } from 'uuid';
import { Vec2 } from 'ServerCore/src/utils/vec2.js';
import { Tile, Tilemap } from './tilemap.js';
import { Base } from '../game/base.js';
import { MathUtils } from '../../utils/mathUtils.js';
import { Tower } from '../game/tower.js';
import { MonsterHealthUpdateSchema } from '../../protocol/struct_pb.js';
import { B2C_MonsterHealthUpdateNotificationSchema } from '../../protocol/monster_pb.js';
import { B2C_UseSkillNotificationSchema } from '../../protocol/skill_pb.js';

export class GameRoom {
  //유저의 스폰 위치
  static spawnCoordinates = [
    { x: 18, y: 19 },
    { x: 19, y: 19 },
    { x: 18, y: 18 },
    { x: 19, y: 18 }
  ];

  /**---------------------------------------------
   * @param {number} id - 방의 고유 ID
   * @param {number} maxPlayerCount - 최대 플레이어 수
   * @param {string} towers - 타워 저장
   ---------------------------------------------*/
  constructor(id, maxPlayerCount) {
    this.users = new Map();
    this.id = id;
    this.monsters = new Map();
    this.towers = new Map();

    //this.grid = { width: 32, height: 32 };
    this.tilemap = new Tilemap({ x: 16, y: 16 });

    //this.base = new Vec2(0, 0); // 기지의 좌표
    this.base = new Base(300, create(PosInfoSchema, { x: 16, y: 16 }));

    //this.obstacles = []; // 장애물 좌표 배열
    //this.excludedCoordinates = [...this.base]; // 장애물이 생성되지 않도록 할 좌표 목록

    this.maxPlayerCount = maxPlayerCount;
    this.monsterSpawner = new MonsterSpawner(this);

    //this.generateObstacles(); // 장애물 랜덤 배치
    this.updateInterval = 200; // 200ms 간격으로 업데이트
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
    this.users.set(player.session.getId(), player, this);
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
      player.initCard();
      //몬스터 생성
      this.OnGameStart();
    }
  }

  /**---------------------------------------------
   * [장애물 생성]
   * @param {number} [obstacleCount=20]
   * @returns {PosInfo[]}
   */ //---------------------------------------------
  generateObstacles(obstacleCount = 20) {
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
    console.log(arr);
    console.log(arr.length);
    return arr;
  }

  /*---------------------------------------------
  [길찾기]
---------------------------------------------*/
  findPath(src, dest) {
    const path = [];

    const pq = [];
    const best = new Map();
    const parent = new Map();

    const key = (vec) => `${vec.x},${vec.y}`;
    // 초기값 설정
    {
      const cost = Math.abs(dest.y - src.y) + Math.abs(dest.x - src.x);
      pq.push({ cost, pos: src });
      best.set(key(src), cost);
      parent.set(key(src), src);
    }
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    let found = false;

    while (pq.length > 0) {
      // 우선순위 큐에서 최소 비용 노드 선택
      pq.sort((a, b) => a.cost - b.cost);
      const node = pq.shift();

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
        const nextPos = {
          x: node.pos.x + dir.x,
          y: node.pos.y + dir.y,
        };

        const nextKey = key(nextPos);

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

  /**
   * @param {Object} pos - 현재 위치 {x, y}.
   * @returns {Object|null} - 가장 가까운 Tower 또는 Base 객체, 없으면 null.
   */
  findCloseBuilding(pos) {
    /** @type {Object|null} */
    let ret = null;
    /** @type {number} */
    let best = Number.MAX_VALUE;

    // 타워 거리 계산
    for (const tower of this.towers) {
      if (tower[1]) {
        const dirX = pos.x - tower[1].getPos().x;
        const dirY = pos.y - tower[1].getPos().y;
        /** @type {number} */
        const dist = dirX * dirX + dirY * dirY; // 유클리드 거리 계산

        if (dist < best) {
          best = dist;
          ret = tower[1];
        }
      }
    }

    // Base 거리 계산 (3x3 크기 고려)
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
        /** @type {number} */
        const dist = dirX * dirX + dirY * dirY;

        if (dist < best) {
          best = dist;
          ret = this.base; // Base 객체를 반환
        }
      }
    }

    return ret;
  }

  parseKey(key) {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  canGo(pos) {
    const tile = this.tilemap.getTile(pos);
    return tile !== null;
  }

  OnGameStart() {
    console.log('OnGameStart Called');
    this.monsterSpawner.startSpawning(0);

    setInterval(() => {
      this.gameLoop();
    }, this.updateInterval);
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
  handleSkill(payload, session) {
    const { prefabId, skillPos } = payload.skill;
    const user = this.users.get(session.getId());
    // 카드사용
    user.useCard(payload.cardId);
    console.log(user.cardList);
    console.log('skill: ', prefabId);
    console.log('skillPos: ', skillPos);
    // 카드 데이터 가져옴
    const card = assetManager.getCardDataByPrefabId(prefabId);

    const applyDamageToMonsters = (monsters, damage) => {
      monsters.forEach((monster) => {
        monster.hp -= damage;
        if (monster.hp <= 0) {
          this.handleMonsterDeath(monster);
        }
      });
    };

    switch (card.prefabId) {
      case 'OrbitalBeam': // 궤도 폭격
        const monstersInRangeForOrbital = [];
        for (const [key, monster] of this.monsters) {
          const distance = Math.sqrt(
            Math.pow(monster.pos.x - skillPos.x, 2) + Math.pow(monster.pos.y - skillPos.y, 2),
          );
          if (distance <= card.range) {
            monstersInRangeForOrbital.push(monster);
          }
        }
        applyDamageToMonsters(monstersInRangeForOrbital, card.damage);
        break;
      case 'CARPET_BOMBING': // 융단 폭격(구현예정)
        const monstersInLineRange = this.monsters.filter((monster) => {
          // 점과 직선 사이의 거리를 구하는 공식
          // |Ax + By + C| / sqrt(A^2 + B^2)
          // 여기서 A = posInfo.y - 0, B = -(posInfo.x - 0), C = 0
          const distance =
            Math.abs(
              (skillPos.y - 0) * monster.pos.x -
                (skillPos.x - 0) * monster.pos.y +
                (skillPos.x * 0 - skillPos.y * 0),
            ) / Math.sqrt(Math.pow(skillPos.y - 0, 2) + Math.pow(skillPos.x - 0, 2));
          return distance <= card.range;
        });
        applyDamageToMonsters(monstersInLineRange, card.damage);
        break;
      case 'TowerRepair': // 타워 힐
        let towerToHeal = null;
        for (const [key, tower] of this.towers) {
          if (tower.pos.x === skillPos.x && tower.pos.y === skillPos.y) {
            towerToHeal = tower;
            break;
          }
        }
        if (towerToHeal) {
          towerToHeal.hp += card.heal;
          if (towerToHeal.hp > towerToHeal.maxHp) {
            towerToHeal.hp = towerToHeal.maxHp;
          }
          console.log(towerToHeal);
        } else {
          console.log('해당 위치에 타워가 존재하지 않음');
          user.reAddCardOnFailure(prefabId);
          return;
        }
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
    if (card.type === 'Attack') {
      const monsterHealthUpdates = monstersInLineRange.map((monster, index) =>
        create(MonsterHealthUpdateSchema, {
          monsterId: index,
          currentHp: monster.hp,
          maxHp: monster.maxHp,
        }),
      );

      const monsterHealthUpdateNotification = create(B2C_MonsterHealthUpdateNotificationSchema, {
        healthUpdates: monsterHealthUpdates,
      });

      const monsterHealthUpdateBuffer = PacketUtils.SerializePacket(
        monsterHealthUpdateNotification,
        B2C_MonsterHealthUpdateNotificationSchema,
        ePacketId.B2C_MonsterHealthUpdateNotification,
        0,
      );

      this.broadcast(monsterHealthUpdateBuffer);
    }
  }

  /**---------------------------------------------
   * [타워 생성 동기화]
   * @param {Buffer} buffer - 타워 생성 패킷 데이터
   * @param {C2B_TowerBuildRequest} packet - 타워 생성 패킷 데이터
   ---------------------------------------------*/
  handleTowerBuild(packet, session) {
    console.log('handleTowerBuild');
    const { tower, ownerId, cardId } = packet;
    const user = this.users.get(session.getId());
    user.useCard(cardId);

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
      //uuid: uu,
      uuid: packet.tower.towerId,
      x: packet.tower.towerPos.x,
      y: packet.tower.towerPos.y,
    });
    const newTower = new Tower(packet.tower.prefabId, towerPosInfo, this);
    this.addObject(newTower);
    this.towers.set(newTower.getId(), newTower);
    console.log(
      `타워생성 성공. towerId: ${tower.towerId}, prefabId: ${towerData.prefabId}, 위치: (${tower.towerPos}`,
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

  // /**---------------------------------------------
  //  * [타워 공격 동기화]
  //  * @param {C2B_TowerAttackRequest} packet - 타워 공격 패킷 데이터
  //  * @param {Session} session - 세션 정보
  //  ---------------------------------------------*/
  // handleTowerAttack(packet, session) {
  //   // 몬스터 길 찾기 완료 후 수정 예정
  //   console.log('handleTowerAttack');
  //   const { towerId, targetId } = packet;

  //   // 1. 타워와 타겟 존재 확인
  //   const tower = this.towers.get(towerId);
  //   const target = this.monsters.get(targetId);

  //   // 타워나 타겟이 존재하지 않으면
  //   if (!tower || !target) {
  //     console.log(`타워 or 타겟이 존재하지 않음. towerId: ${towerId}, targetId: ${targetId}`);
  //     const failNotification = create(B2C_TowerAttackNotificationSchema, {
  //       isSuccess: false,
  //       damage: 0,
  //       targetHealth: 0,
  //     });

  //     const failBuffer = PacketUtils.SerializePacket(
  //       failNotification,
  //       B2C_TowerAttackNotificationSchema,
  //       ePacketId.B2C_TowerAttackNotification,
  //       session.getNextSequence(),
  //     );

  //     session.send(failBuffer);
  //     return;
  //   }

  //   // 2. B2C_TowerAttackNotification 패킷 생성
  //   const notification = create(B2C_TowerAttackNotificationSchema, {
  //     isSuccess: true,
  //     damage: 0,
  //     targetHealth: 0,
  //   });

  //   const notificationBuffer = PacketUtils.SerializePacket(
  //     notification,
  //     B2C_TowerAttackNotificationSchema,
  //     ePacketId.B2C_TowerAttackNotification,
  //     session.getNextSequence(),
  //   );

  //   this.broadcast(notificationBuffer);
  // }

  // /**---------------------------------------------
  //  * [타워 파괴 동기화]
  //  * @param {C2B_TowerDestroyRequest} packet - 타워 파괴 패킷 데이터
  //  * @param {Session} session - 세션 정보
  //  ---------------------------------------------*/
  // handleTowerDestroy(packet, session) {
  //   // 몬스터 길 찾기 완료 후 수정 예정
  //   console.log('handleTowerDestroy');
  //   const { towerId } = packet;

  //   // 1. 타워가 있는지 확인
  //   const tower = this.towers.get(towerId);
  //   if (!tower) {
  //     console.log(`타워가 존재하지 않음. towerId: ${towerId}`);
  //     const failResponse = create(C2B_TowerDestroyResponseSchema, {
  //       towerId: -1, // 실패
  //     });

  //     const failBuffer = PacketUtils.SerializePacket(
  //       failResponse,
  //       C2B_TowerDestroyResponseSchema,
  //       ePacketId.C2B_TowerDestroyResponse,
  //       session.getNextSequence(),
  //     );

  //     session.send(failBuffer);
  //     return;
  //   }

  //   // 2. 타워 제거
  //   this.towers.delete(towerId);
  //   console.log(`[타워] 파괴 성공. towerId: ${towerId}`);

  //   // 3. 요청한 클라이언트에게 응답
  //   const response = create(C2B_TowerDestroyResponseSchema, {
  //     towerId: towerId,
  //   });

  //   const responseBuffer = PacketUtils.SerializePacket(
  //     response,
  //     C2B_TowerDestroyResponseSchema,
  //     ePacketId.C2B_TowerDestroyResponse,
  //     session.getNextSequence(),
  //   );

  //   session.send(responseBuffer);

  //   // 4. 모든 클라이언트에게 타워 파괴 알림
  //   const notification = create(C2B_TowerDestroyNotificationSchema, {
  //     towerId: towerId,
  //   });

  //   const notificationBuffer = PacketUtils.SerializePacket(
  //     notification,
  //     C2B_TowerDestroyNotificationSchema,
  //     ePacketId.C2B_TowerDestroyNotification,
  //     session.getNextSequence(),
  //   );

  //   this.broadcast(notificationBuffer);
  // }

  /**---------------------------------------------
   * [몬스터 타워 공격 동기화]
   * @param {Buffer} buffer - 몬스터 타워 공격 패킷 데이터
   ---------------------------------------------*/
  handleMonsterAttackTower(buffer) {
    const moster = this.monsters.find((m) => m.id === buffer.id); //걍 막 하는중
    if (!moster) {
      //오류
    }
    const target = this.towers.get(buffer.towerid);

    moster.attackTarget(target);

    if (target.hp <= 0) {
      this.towers.delete(buffer.towerid);
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
  //   for (const [_, tower] of this.towers) {
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
    if (position.x < 0 || position.x > 32 || position.y < 0 || position.y > 32) {
      console.log(`맵 범위 초과. 위치: ${position.x}, ${position.y}`);
      return false;
    }

    return true;
  }

  /**
   * 게임 루프 시작
   */
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
    // if (this.checkBaseHealth()) {
    //   //게임 종료 알림(false 시 패배)
    //   const endNotification = create(B2C_GameEndNotificationSchema, {
    //     isSuccess: false,
    //   });
    //   //패킷 직렬화
    //   const endBuffer = PacketUtils.SerializePacket(
    //     endNotification,
    //     B2C_GameEndNotificationSchema,
    //     ePacketId.B2C_GameEndNotification,
    //     0,
    //   );

    //   this.broadcast(endBuffer);
    //   //게임 종료 후 방 삭제
    //   gameRoomManager.freeRoomId(this.id);
    // }
    //유저가 0명이 되는 순간 게임 종료
    if (this.users.size === 0) {
      gameRoomManager.freeRoomId(this.id);
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
      console.log('몬스터 생성', object.getId());

      const packet = create(B2C_SpawnMonsterNotificationSchema, {
        posInfo: object.getPos(),
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
    } else if (object instanceof Tower) {
      this.towers.delete(uuid);
    }
  }

  findObject(uuid) {
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

  getMonsterSearchAndReward = (monster) => {
    const reward = monsterInfo.monsterInfo[monster.monsterNumber - 1];
    this.score += reward.score;
  };

  /**
   * 장애물 랜덤 배치
   */
  // generateObstacles() {
  //   const totalCells = this.grid.width * this.grid.height; // 전체 셀 개수
  //   const obstacleCount = Math.floor(totalCells * 0.1); // 장애물 개수 조절 (10%)
  //   const obstacleSet = new Set();

  //   // "생성 금지 좌표"를 문자열로 변환하여 비교에 사용
  //   const excludedSet = new Set(this.excludedCoordinates.map(({ x, y }) => `${x},${y}`));

  //   while (obstacleSet.size < obstacleCount) {
  //     const randomX = Math.floor(Math.random() * 22) - 11;
  //     const randomY = Math.floor(Math.random() * 28) - 14;
  //     const coordinate = `${randomX},${randomY}`;

  //     // 생성 금지 좌표가 아니라면 추가
  //     if (!excludedSet.has(coordinate)) {
  //       obstacleSet.add(coordinate);
  //     }
  //   }

  //   this.obstacles = Array.from(obstacleSet).map((coordinate) => {
  //     const [x, y] = coordinate.split(',').map(Number);
  //     return { x, y };
  //   });

  //   console.log('장애물 배치 완료:', this.obstacles);

  //   const obstacleSpawnPacket = create(B2C_ObstacleSpawnNotificationSchemaSchema, {
  //     obstacles: this.obstacles,
  //   });

  //   const obstacleBuffer = PacketUtils.SerializePacket(
  //     obstacleSpawnPacket,
  //     B2C_ObstacleSpawnNotificationSchemaSchema,
  //     ePacketId.B2C_ObstacleSpawnNotification,
  //     0,
  //   );

  //   this.broadcast(obstacleBuffer);
  // }
}
