import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import {
  L2C_JoinRoomNotificationSchema,
  L2C_JoinRoomResponseSchema,
  L2C_LeaveRoomNotificationSchema,
  L2C_LeaveRoomResponseSchema,
} from '../../protocol/room_pb.js';
import { LobbySession } from '../../main/session/lobbySession.js';
import { create } from '@bufbuild/protobuf';

/**
 * @enum {number}
 */
export const eRoomStateId = {
  WAITING: 0,
  IN_PROGRESS: 1,
};

export class Room {
  /**---------------------------------------------
   * [생성자]
   * @param {number} id - 방의 고유 ID
   * @param {string} roomName - 방 이름
   * @param {number} [maxPlayerCount=4] - 최대 플레이어 수
  ---------------------------------------------*/
  constructor(id, roomName, maxPlayerCount = 4) {
    this.id = id;
    this.roomName = roomName;
    this.users = [];
    this.state = eRoomStateId.WAITING;
    this.maxPlayerCount = maxPlayerCount;
  }

  /**---------------------------------------------
   *  [방 입장]
   * @param {LobbySession} newUser - 새로운 유저 세션
   * @returns {boolean} - 입장 성공 여부
  
       1. 방이 가득 찼는지 확인
       2. 기존 플레이어 목록을 유저에게 보내기
       3. 유저 추가
       4. 새 유저 입장 정보를 다른 유저들에게 알리기
  ---------------------------------------------*/
  enterRoom(newUser) {
    console.log('enterRoom 호출 됨');
    // 1. 유저 추가
    this.users.push(newUser); // 방에 새 유저 추가

    // 2. 기존 플레이어 목록 및 룸 데이터 전송
    const existingPlayers = this.users.map((user) => ({
      id: user.getId(),
      name: user.getNickname(),
    }));
    const roomData = {
      id: this.id, // 방 ID
      ownerId: this.users[0].getId(), // 방 소유자 ID
      name: this.getRoomName(), // 방 이름
      maxUserNum: this.maxPlayerCount, // 최대 유저 수
      state: this.state, // 방 상태
      users: existingPlayers, // 최대 유저 수 반환
    };

    const JoinRoomResponsePacket = create(L2C_JoinRoomResponseSchema, {
      isSuccess: true,
      room: roomData,
      failCode: ErrorCodes.NONE_FAILCODE,
    });

    const JoinRoomResponseBuffer = PacketUtils.SerializePacket(
      JoinRoomResponsePacket,
      L2C_JoinRoomResponseSchema,
      ePacketId.L2C_JoinRoomResponse,
      newUser.getNextSequence(),
    );

    newUser.send(JoinRoomResponseBuffer);

    console.log(newUser.getId(), newUser.getNickname());
    // 3. 새 유저 입장 알림 (본인 제외)

    const joinNotificationPacket = create(L2C_JoinRoomNotificationSchema, {
      userData: { id: newUser.getId(), name: newUser.getNickname() },
    });

    const joinNotificationBuffer = PacketUtils.SerializePacket(
      joinNotificationPacket,
      L2C_JoinRoomNotificationSchema,
      ePacketId.L2C_JoinRoomNotification,
      newUser.getNextSequence(),
    );

    // 모든 유저에게 새 유저 입장 알림 전송 (본인 제외)
    this.broadcast(joinNotificationBuffer, newUser);

    return true; // 입장 성공
  }

  /**---------------------------------------------
    [방 퇴장]
  ---------------------------------------------*/
  leaveRoom(player) {
    console.log('leaveRoom 호출 됨');
    // 유저 제거
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

  /**---------------------------------------------
    [broadcast]
---------------------------------------------*/
  broadcast(buffer, excludeUser = null) {
    this.users.forEach(user => {
      if (user !== excludeUser) {
        user.send(buffer);
      }
    });
  }

  /**---------------------------------------------
     * 현재 방 이름 반환
     * @returns {string}
   ---------------------------------------------*/
  getRoomName() {
    return this.roomName;
  }

  /**---------------------------------------------
     * 현재 유저 수 반환
     * @returns {number}
   ---------------------------------------------*/
  getCurrentUsersCount() {
    return this.users.length;
  }

  /**---------------------------------------------
     * 최대 유저 수 반환
     * @returns {number}
   ---------------------------------------------*/
  getMaxUsersCount() {
    return this.maxPlayerCount;
  }
}
