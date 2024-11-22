import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { LobbySession } from '../../main/session/lobbySession.js';
import {
  L2C_JoinRoomNotificationSchema,
  L2C_JoinRoomResponseSchema,
  L2C_LeaveRoomNotificationSchema,
  L2C_LeaveRoomResponseSchema,
} from '../../protocol/room_pb.js';
import { create } from '@bufbuild/protobuf';
import { CharacterDataSchema, RoomDataSchema, UserDataSchema } from '../../protocol/struct_pb.js';
import { RoomStateType } from '../../protocol/enum_pb.js';

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
    // 1. 방이 가득 찼는지 확인
    if (this.users.length >= this.maxPlayerCount) {
      console.log('풀방');

      // 방이 가득 찼을 때 실패 패킷 생성 및 전송
      const fullRoomPacket = create(L2C_JoinRoomResponseSchema, {
        roomInfo: {},
        failCode: ErrorCodes.ROOM_FULL, // ROOM_FULL 추가 필요
        isSuccess: false,
      });

      const fullRoomBuffer = PacketUtils.SerializePacket(
        fullRoomPacket,
        L2C_JoinRoomResponseSchema,
        ePacketId.L2C_JoinRoomResponse,
        newUser.getNextSequence(),
      );

      newUser.send(fullRoomBuffer);
      return false; // 방 입장 실패
    }

    // 2. 기존 플레이어 목록 및 룸 데이터를 유저에게 보내기 전송
    const existingPlayers = [];
    for (const user of this.users) {
      existingPlayers.push(
        create(UserDataSchema, {
          id: user.getId(),
          name: user.getNickname(),
          characterType: create(CharacterDataSchema, {
            characterType: user.getCharacterType(),
          }),
        }),
      );
    }

    const roomData = create(RoomDataSchema, {
      id: this.id, // 방 ID
      name: this.getRoomName(), // 방 이름
      maxUserNum: this.maxPlayerCount, // 최대 유저 수
      ownerId: 'tmp',
      state: RoomStateType.WAIT, // 방 상태
      users: existingPlayers, // 유저, 캐릭터 반환
    });

    const JoinRoomResponsePacket = create(L2C_JoinRoomResponseSchema, {
      roomInfo: roomData,
    });

    const JoinRoomResponseBuffer = PacketUtils.SerializePacket(
      JoinRoomResponsePacket,
      L2C_JoinRoomResponseSchema,
      ePacketId.L2C_JoinRoomResponse,
      newUser.getNextSequence(),
    );

    newUser.send(JoinRoomResponseBuffer);

    //3. 유저 추가
    this.users.push(newUser);

    try {
      //4. 새 유저 입장 정보를 다른 유저들에게 알리기
      const joinNotificationPacket = create(L2C_JoinRoomNotificationSchema, {
        joinUser: create(UserDataSchema, {
          id: newUser.getId(),
          name: newUser.getNickname(),
          character: create(CharacterDataSchema, {
            characterType: newUser.getCharacterType(),
          }),
        }),
      });

      const joinNotificationBuffer = PacketUtils.SerializePacket(
        joinNotificationPacket,
        L2C_JoinRoomNotificationSchema,
        ePacketId.L2C_JoinRoomNotification,
        0,
      );

      this.broadcast(joinNotificationBuffer);
    } catch (error) {
      console.log(error);
    }

    return true; // 입장 성공
  }

  /**---------------------------------------------
    [방 퇴장]

    1. 퇴장하는 유저에게 결과 통보
    2. 기존 유저에게 퇴장하는 유저 정보 전송
  ---------------------------------------------*/
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

  /**---------------------------------------------
    [broadcast]
---------------------------------------------*/
  broadcast(buffer) {
    for (const user of this.users) {
      user.send(buffer);
    }
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
