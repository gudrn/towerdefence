import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { B2C_SpawnMonsterResponseSchema } from '../../protocol/monster_pb.js';
import {
  B2C_GameStartNotificationSchema,
  B2C_JoinRoomResponseSchema,
  B2L_CreateGameRoomResponeSchema,
  L2B_CreateGameRoomRequestSchema,
} from '../../protocol/room_pb.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { fromBinary, create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';

export class GameRoom {
  /**---------------------------------------------
   * @param {number} id - 방의 고유 ID
   * @param {number} maxPlayerCount - 최대 플레이어 수
   ---------------------------------------------*/
  constructor(id, maxPlayerCount) {
    this.users = [];
    this.id = id;
    this.monsterList = [];
    this.maxPlayerCount = maxPlayerCount;
  }

  getMonsterList() {
    return this.monsterList;
  }

  // 1. 방이 가득 찼는지 확인
  addplayer(player) {
    if (this.users.length >= this.maxPlayerCount) {
      return false; // 방이 가득 참
    }
    if (this.users.find((user) => user.id === player.id)) {
      return false; // 중복 플레이어
    }
    // 2. 유저 추가
    this.users.push(player);
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
      console.log(`플레이어를 방에 추가하지 못했습니다. roomId: ${roomId}, player: ${player.id}`);
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '방 입장에 실패했습니다.');
    }

    // 3. 해당 유저에게 B2C_JoinRoomResponse패킷 전송
    const responsePacket = create(B2C_JoinRoomResponseSchema, {
      isSuccess: true,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      responsePacket,
      B2C_JoinRoomResponseSchema,
      ePacketId.B2C_Enter,
      player.session.getNextSequence(),
    );

    player.session.send(sendBuffer);

    // 4. 모든 인원이 들어왔다면 B2C_GameStartNotification패킷 전송
    if (this.users.length === this.maxPlayerCount) {
      console.log('모든 유저가 입장하였습니다. 게임을 시작합니다.');

      const userDatas = this.users.map((user) => user.userData);
      const gameStartPacket = create(B2C_GameStartNotificationSchema, {
        userDatas,
      });

      const gameStartBuffer = PacketUtils.SerializePacket(
        gameStartPacket,
        B2C_GameStartNotificationSchema,
        ePacketId.B2C_GameStartNotification,
        player.session.getNextSequence(),
      );

      this.broadcast(gameStartBuffer);
    }
  }

  /**---------------------------------------------
   * [이동 동기화]
   * @param {Buffer} buffer - 이동 패킷 데이터
   ---------------------------------------------*/
  handleMove(buffer) {}

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
  handleSpawnMonster() {}

  /**---------------------------------------------
   * [몬스터 타워 공격 동기화]
   * @param {Buffer} buffer - 몬스터 타워 공격 패킷 데이터
   ---------------------------------------------*/
  handleMonsterAttackTower(buffer) {}

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
      user.session.send(buffer);
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
   * 고유 Room ID를 생성하는 함수
   * @returns {string} 생성된 Room ID
   */
  generateUniqueMonsterId() {
    // monsterId를 만드는데 UUID를 쓸건지는 자유
    return `${Date.now()}-${Math.floor(Math.random() * 1000 + 1)}`;
  }
  /**
   * 고유 monsterId ID를 제거하는 함수
   * @returns {string} 생성된 monsterId
   */
  removeMonster(monsterId = undefined) {
    if (monsterId === undefined && this.monsterList.length > 0) {
      this.monsterList.shift();
    } else if (this.monsterList.length > 0) {
      const index = this.monsterList.findIndex((monster) => monster.monsterId === monsterId);
      if (index !== -1) {
        const monster = this.monsterList.splice(index, 1)[0];
        if (monster) this.getMonsterSearchAndReward(monster); // 죽인 몬스터가 진짜 있을 경우
      }
    }
  }

  /**
   * monster 처치 시 보상주는 함수
   * @returns {string} 생성된 monster
   */
  getMonsterSearchAndReward = (monster) => {
    //여기의  monsterJson는 json파일명에 따라 달라짐.
    const reward = monsterJson[monster.monsterNumber - 1];
    this.score += reward.score;
  };
}
