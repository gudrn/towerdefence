import { create, toBinary } from '@bufbuild/protobuf';
import { RoomDataSchema, UserDataSchema } from '../../protocol/struct_pb.js';
import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { L2C_JoinRoomNotificationSchema, L2C_JoinRoomResponseSchema, L2C_LeaveRoomNotificationSchema, L2C_LeaveRoomResponseSchema } from '../../protocol/room_pb.js';
import { eRoomStateId } from '../../config/roomState.js';

/**
 * Room 클래스
 * 게임 방 관리
 */
export class Room {
  /**
   * @param {number} id 방 ID
   * @param {string} roomName 방 이름
   * @param {number} [maxPlayerCount=2] 최대 플레이어 수
   */
  constructor(id, roomName, maxPlayerCount = 2) {
    this.id = id;
    this.roomName = roomName;
    this.users = [];
    this.state = eRoomStateId.WAITING; // 'waiting', 'inProgress'
    this.maxPlayerCount = maxPlayerCount;
    this.score = 0; 
  }

  /**
   * 방에 유저 입장
   * @param {GamePlayer} newUser 새로운 유저 객체
   * @returns {boolean} 성공 여부
   */
  enterRoom(newUser) {
    //console.log('Room::enterRoom');

    // 1. 방이 가득 찼는지 확인
    if (this.users.length >= this.maxPlayerCount) {
      console.log('풀방');
      return false;
    }

    // 2. 기존 플레이어 목록을 유저에게 보내기
    {
      const existUsers = [];
      for (const user of this.users) {
        existUsers.push(
          create(UserDataSchema, {
            id: user.getId(),
            name: user.getNickname(),
            prefabId: user.getPrefabId()
          })
        );
      }

      const packet = create(L2C_JoinRoomResponseSchema, {
        roomInfo: create(RoomDataSchema, {
          id: this.id,
          name: this.roomName,
          maxUserNum: this.maxPlayerCount,
          ownerId: 'tmp',
          state: eRoomStateId.WAITING,
          users: existUsers,
        }),
      });

      const sendBuffer = PacketUtils.SerializePacket(
        packet,
        L2C_JoinRoomResponseSchema,
        ePacketId.L2C_JoinRoomResponse,
        newUser.getNextSequence()
      );

      console.log('Serialized packet size:', sendBuffer.length);
      newUser.send(sendBuffer);
    }

    // 3. 유저 추가
    this.users.push(newUser);

    // 4. 새 유저 입장 정보를 다른 유저들에게 알리기
    {
      console.log('아이디는 ', newUser.getId());

      const packet = create(L2C_JoinRoomNotificationSchema, {
        joinUser: create(UserDataSchema, {
          id: newUser.getId(),
          name: newUser.getNickname(),
          prefabId: newUser.getPrefabId()
        }),
      });

      const sendBuffer = PacketUtils.SerializePacket(
        packet,
        L2C_JoinRoomNotificationSchema,
        ePacketId.L2C_JoinRoomNotification,
        0
      );

      this.broadcast(sendBuffer);
    }

    return true;
  }

  /**
   * 방에서 유저 퇴장
   * @param {Object} player 퇴장할 유저 객체
   * @returns {boolean} 성공 여부
   */
  leaveRoom(player) {
    console.log('leaveRoom 호출 됨');
    // 유저 제거, 최대 4명의 유저가 담겨서 filter로 충분
    this.users = this.users.filter((user) => user !== player);

    const leaveResponse = create(L2C_LeaveRoomResponseSchema, {
      isSuccess: true,
      failCode: 0,
    });
    const leaveResponseBuffer = PacketUtils.SerializePacket(
      leaveResponse,
      L2C_LeaveRoomResponseSchema,
      ePacketId.L2C_LeaveRoomResponse,
      player.getNextSequence(),
    );
    player.send(leaveResponseBuffer);

    // 유저 퇴장 알림
    const leaveNotificationPacket = create(L2C_LeaveRoomNotificationSchema, {
      userId: player.getId(),
    });

    const leaveNotificationBuffer = PacketUtils.SerializePacket(
      leaveNotificationPacket,
      L2C_LeaveRoomNotificationSchema,
      ePacketId.L2C_LeaveRoomNotification,
      player.getNextSequence(),
    );

    // 나머지 유저들에게 유저 퇴장 알림 전송
    this.broadcast(leaveNotificationBuffer);

    return true; // 퇴장 성공
  }

  /**
   * @param {string} userId 유저 ID
   * @returns {Object|undefined} 해당 유저 객체
   */
  getUser(userId) {
    return this.users.find((user) => user.getId() === userId);
  }

  /**
   * 게임 시작
   */
  startGame() {
    this.state = eRoomStateId.IN_PROGRESS;

    // TODO: 게임 시작 로직 구현
  }

  /**
   * 모든 유저에게 메시지 전송
   * @param {Buffer} buffer 전송할 데이터
   */
  broadcast(buffer) {
    for (const user of this.users) {
      user.send(buffer);
    }
  }

  /**
   * 방 이름 반환
   * @returns {string} 방 이름
   */
  getRoomName() {
    return this.roomName;
  }

  /**
   * 현재 유저 수 반환
   * @returns {number} 현재 유저 수
   */
  getCurrentUsersCount() {
    return this.users.length;
  }

  /**
   * 최대 유저 수 반환
   * @returns {number} 최대 유저 수
   */
  getMaxUsersCount() {
    return this.maxPlayerCount;
  }
}
