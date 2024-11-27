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
import { GamePlayerDataSchema, PosInfoSchema } from '../../protocol/struct_pb.js';
import { Monster } from '../game/monster.js';
import { B2C_SpawnMonsterNotificationSchema } from '../../protocol/monster_pb.js';
import { B2C_PositionUpdateNotificationSchema } from '../../protocol/character_pb.js';
import {
  B2C_AddTowerNotificationSchema,
  B2C_TowerBuildResponseSchema,
  B2C_TowerAttackNotificationSchema,
  C2B_TowerDestroyNotificationSchema,
  C2B_TowerDestroyResponseSchema,
} from '../../protocol/tower_pb.js';

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
   ---------------------------------------------*/
  constructor(id, maxPlayerCount) {
    this.users = new Map();
    this.id = id;
    this.monsters = new Map();
    this.towerList = new Map();
    this.maxPlayerCount = maxPlayerCount;
    this.monsterSpawner = new MonsterSpawner(this);
  }

  getMonsterList() {
    return this.monsters;
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

    // 위치 검증
    if (!this.validatePosition(clientPacket.posInfos)) {
      console.log(`유효하지 않은 위치. ${clientPacket.posInfos}`);
      return;
    }

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
   * @param {C2B_TowerBuildRequest} packet - 타워 생성 패킷 데이터
   ---------------------------------------------*/
  handleTowerBuild(packet, session) {
    console.log('handleTowerBuild')
    const { tower, ownerId } = packet;

    // 1. 타워 데이터 존재 확인
    const towerData = assetManager.getTowerData(tower.towerId);
    if (!towerData) {
      const failResponse = create(B2C_TowerBuildResponseSchema, {
        isSuccess: false,
        tower: null,
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
    const newTower = {
      towerPos: tower.towerPos,
      ownerId: ownerId,
      prefabId: towerData.prefabId,
    };

    this.towerList.set(tower.towerId, newTower);
    console.log(`타워생성 성공. towerId: ${tower.towerId}, prefabId: ${towerData.prefabId}, 위치: (${tower.towerPos}`);

    // 3. 타워 생성 성공 응답
    const successResponse = create(B2C_TowerBuildResponseSchema, {
      isSuccess: true,
      tower: tower,
    });

    const responseBuffer = PacketUtils.SerializePacket(
      successResponse,
      B2C_TowerBuildResponseSchema,
      ePacketId.B2C_TowerBuildResponse,
      session.getNextSequence(),
    );

    session.send(responseBuffer);

    // 4. 모든 클라이언트에게 타워 추가 알림
    const notification = create(B2C_AddTowerNotificationSchema, {
      tower: tower,
      ownerId: ownerId,
    });

    const notificationBuffer = PacketUtils.SerializePacket(
      notification,
      B2C_AddTowerNotificationSchema,
      ePacketId.B2C_AddTowerNotification,
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
    console.log('handleTowerAttack')
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
    console.log('handleTowerDestroy')
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
   * [몬스터 생성]
   ---------------------------------------------*/
  handleSpawnMonster(session) {}

  /**---------------------------------------------
   * [몬스터 타워 공격 동기화]
   * @param {Buffer} buffer - 몬스터 타워 공격 패킷 데이터
   ---------------------------------------------*/
  handleMonsterAttackTower(buffer) {
    const moster = this.monsterList.find((m) => m.id === buffer.id); //걍 막 하는중
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
    if (position.x < 0 || position.x >= 32 || position.y < 0 || position.y >= 32) {
      console.log(`맵 범위 초과. 위치: ${position.x}, ${position.y}`);
      return false;
    }

    return true;
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
  }

  getMonsterSearchAndReward = (monster) => {
    const reward = monsterInfo.monsterInfo[monster.monsterNumber - 1];
    this.score += reward.score;
  };
}
