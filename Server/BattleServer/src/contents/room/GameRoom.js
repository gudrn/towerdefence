import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { B2C_PositionUpdateNotificationSchema } from '../../protocol/character_pb.js';

export class GameRoom {
  /**---------------------------------------------
   * @param {number} id - 방의 고유 ID
   * @param {number} maxPlayerCount - 최대 플레이어 수
   ---------------------------------------------*/
  constructor(id, maxPlayerCount) {
    this.users = [];
    this.id = id;
    this.maxPlayerCount = maxPlayerCount;
  }

  /**---------------------------------------------
   * [방 입장]
   * @param {GamePlayer} player - 입장할 플레이어 정보
   * @returns {boolean} - 추가 성공 여부
   ---------------------------------------------*/
  // 1. 방이 가득 찼는지 확인
  enterRoom(player) {
    if (this.users.length >= this.maxPlayerCount) {
      return false; // 방이 가득 참
    }
    if (this.users.find((user) => user.id === player.id)) {
      return false; // 중복 플레이어
    }
    // 2. 유저 추가
    this.users.push(player);
    return true;
  }

  // 3. 해당 유저에게 B2C_EnterRoomMe 패킷 전송
  // 4. 모든 인원이 들어왔다면 B2C_GameStart 패킷 전송

  // /**---------------------------------------------
  //  * [이동 동기화]
  //  * @param {GamePlayer} player - 이동한 플레이어
  //  * @param {Object} position - 새로운 위치 {x, y}
  //  * @param {BattleSession} session - 플레이어 세션
  //  ---------------------------------------------*/
  // handleMove(player, position, session) {

  //   // 1. 플레이어 위치 정보 업데이트
  //   player.updatePosition(position);

  //   // 3. 브로드캐스트용 패킷 생성
  //   const notificationPacket = create(B2C_PositionUpdateNotificationSchema, {
  //     entityData: {
  //       pos: position,
  //       objectType: ObjectType.PLAYER,
  //       uuid: player.id,
  //     },
  //   });

  //   // 4. 패킷 직렬화
  //   const sendBuffer = PacketUtils.SerializePacket(
  //     notificationPacket,
  //     B2C_PositionUpdateNotificationSchema,
  //     ePacketId.B2C_PositionUpdateNotification,
  //     session.getNextSequence(),
  //   );

  //   // 5. 방의 모든 플레이어에게 브로드캐스트
  //   this.broadcast(sendBuffer);
  //   console.log(`플레이어 ${player.id} 이동 동기화 완료`);
  // }

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
   * [몬스터 생성 동기화]
   * @param {Buffer} buffer - 몬스터 생성 패킷 데이터
   ---------------------------------------------*/
  handleSpawnMonster(buffer) {}

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
      level: player.level,
      status: player.status,
    }));
  }

  /**
   * 고유 Room ID를 생성하는 함수
   * @returns {string} 생성된 Room ID
   */
  generateUniqueRoomId() {
    // roomId를 만드는데 UUID를 쓸건지는 자유
    return `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
