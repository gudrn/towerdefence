import { ePacketId } from 'ServerCore/src/network/packetId';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils';
import { PlayerState } from 'src/constants/playerState.js';
import { ObjectType } from 'src/protocol/enum_pb';
import { create } from '@bufbuild/protobuf';
import { B2C_PositionUpdateNotification } from 'src/protocol/position_pb.js';

export class GamePlayer {
  /**---------------------------------------------
     * @param {string} id - 플레이어 고유 ID
     * @param {string} name - 플레이어 이름
     * @param {BattleSession} session - 플레이어 세션
     * @param {CharacterType} characterType - 캐릭터 타입
     ---------------------------------------------*/
  constructor(id, name, session, characterType, room) {
    this.id = id;
    this.name = name;
    this.session = session;
    this.characterType = characterType;
    this.room = room;

    // 초기 위치
    this.position = {
      x: 0,
      y: 0,
    };

    // 상태 정보
    this.state = PlayerState.ALIVE;
    this.lastMoveTime = Date.now();

    // 게임 정보
    this.moveSpeed = 5;

    // 카드 정보
    this.cards = [];
  }

  /**---------------------------------------------
     * 플레이어 상태 동기화
     * @param {PlayerState} newState - 새로운 상태
     ---------------------------------------------*/
  updateState(newState) {
    console.log('updateState 호출 됨');

    // 상태 변경
    this.state = newState;

    // 상태 동기화 패킷 생성
    const notificationPacket = create(B2C_PlayerStateUpdateNotificationSchema, {
      playerId: this.id,
      state: newState,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      notificationPacket,
      B2C_PlayerStateUpdateNotificationSchema,
      ePacketId.B2C_PlayerStateUpdate,
      this.session.getNextSequence(),
    );

    this.room.broadcast(sendBuffer);
  }

  /**---------------------------------------------
  * 플레이어 위치 동기화
  * @param {Object} newPosition - 새로운 위치 {x, y}
  ---------------------------------------------*/
  updatePosition(newPosition) {
    console.log('updatePosition 호출 됨');

    // 위치 업데이트
    this.position = newPosition;

    // 위치 동기화 패킷 생성
    const notificationPacket = create(B2C_PositionUpdateNotification, {
      entityData: {
        pos: {
          x: newPosition.x,
          y: newPosition.y,
        },
        objectType: ObjectType.PLAYER,
        uuid: this.id,
      },
    });

    const sendBuffer = PacketUtils.SerializePacket(
      notificationPacket,
      B2C_PositionUpdateNotification,
      ePacketId.B2C_PositionUpdate,
      this.session.getNextSequence(),
    );

    this.room.broadcast(sendBuffer);
  }

  /**---------------------------------------------
     * 플레이어 이동 속도 설정
     * @param {number} speed - 새로운 이동 속도
     ---------------------------------------------*/
  MoveSpeed(speed) {}

  /**---------------------------------------------
   * [카드 사용 동기화]
   * @param {Buffer} buffer - 카드 사용 패킷 데이터
   ---------------------------------------------*/

  useCard(buffer) {}
}
