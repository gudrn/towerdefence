import { fromBinary, create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import {
  C2L_GameStartSchema,
  L2B_CreateGameRoomRequestSchema,
  C2L_JoinRoomRequestSchema,
  C2L_CreateRoomRequestSchema,
  C2L_LeaveRoomRequestSchema,
  L2C_GetRoomListResponseSchema,
  L2C_CreateRoomResponseSchema,
  B2L_CreateGameRoomResponeSchema,
  L2C_GameStartSchema,
  L2C_JoinRoomResponseSchema,
} from '../../protocol/room_pb.js';
import { battleSessionManager } from '../../server.js';
import { Room } from './room.js';
import { handleError } from '../../utils/errorHandler.js';
import { LobbySession } from '../../main/session/lobbySession.js';
import { lobbyConfig } from '../../config/config.js';
import { RoomDataSchema } from '../../protocol/struct_pb.js';

const MAX_ROOMS_SIZE = 10000;

class RoomManager {
  constructor() {
    /** @private @type {Map<string, Room>} */
    this.rooms = new Map();
    this.availableRoomIds = Array.from({ length: MAX_ROOMS_SIZE }, (_, i) => i + 1);

    this.waitingQueue = [];
    let tmpRoomId = this.availableRoomIds.shift();
    if (!tmpRoomId) tmpRoomId = 0;
    this.rooms.set(tmpRoomId, new Room(tmpRoomId, '정현의 방', 2));
  }

  sendResponse(session, responsePacket, packetSchema, packetId) {
    const response = PacketUtils.SerializePacket(
      responsePacket,
      packetSchema,
      packetId,
      session.getSequence(),
    );
    session.send(response);
  }
  /*---------------------------------------------
    [방 생성]
---------------------------------------------*/
createRoomHandler(buffer, session) {
  console.log('createRoomHandler');
  //패킷 분해
  const packet = fromBinary(C2L_CreateRoomRequestSchema, buffer);
  let roomId = this.availableRoomIds.shift();
  if(roomId == undefined){
    handleError(session, new CustomError(ErrorCodes.SOCKET_ERROR, "방 id부족"));
    return;
  }
  this.rooms.set(roomId, new Room(roomId, packet.name, packet.maxUserNum));

  const response = create(L2C_CreateRoomResponseSchema, {
    isSuccess: true,
    room: create(RoomDataSchema, {
      id: roomId, 
      name: packet.name,
    })
  });

  const sendBuffer = PacketUtils.SerializePacket(response, L2C_CreateRoomResponseSchema, ePacketId.L2C_CreateRoomResponse, 0);
  session.send(sendBuffer);
}
  /**---------------------------------------------
    [방 입장]
    * @param {Buffer} buffer
    * @param {LobbySession} session
---------------------------------------------*/
  enterRoomHandler(buffer, session) {
    console.log('enterRoomHandler');
    // 클라이언트가 보낸 패킷 역직렬화
    const packet = fromBinary(C2L_JoinRoomRequestSchema, buffer);

    //방id가 유효한지 검증

    // 방 ID를 통해 해당 방을 가져오기
    const room = this.rooms.get(packet.roomId);
    room.enterRoom(session);
  }

  /**---------------------------------------------
    [방 퇴장]

    * @param {Buffer} buffer
    * @param {LobbySession} session
---------------------------------------------*/
  leaveRoomHandler(buffer, session) {
    console.log('leaveRoomHandler');

    const packet = fromBinary(C2L_LeaveRoomRequestSchema, buffer);

    const room = this.rooms.get(packet.roomId);

    room.leaveRoom(session);

    if (room.getCurrentUsersCount() <= 0) {
      this.freeRoomId(packet.roomId);
    }
  }

  /**---------------------------------------------
    [방 목록 조회] - 방 목록을 순회하면서 RoomInfo 메시지 생성

    * @param {Buffer} buffer
    * @param {LobbySession | BattleSession} session
---------------------------------------------*/
  getRoomsHandler(buffer, session) {
    console.log('getRoomsHandler');
    // 방 목록 정보 생성
    const roomsData = [];

    // 방 목록을 순회하면서 RoomInfo 메시지 생성
    this.rooms.forEach((room, roomId) => {
      const roomData = {
        id: roomId,
        name: room.getRoomName(),
        maxUserNum: room.getMaxUsersCount(),
        state: room.state,
      };
      roomsData.push(roomData);
    });

    // 방 목록 응답
    const responsePacket = create(L2C_GetRoomListResponseSchema, { rooms: roomsData });
    const sendBuffer = PacketUtils.SerializePacket(
      responsePacket,
      L2C_GetRoomListResponseSchema,
      ePacketId.L2C_GetRoomListResponse,
      0,
    );
    session.send(sendBuffer);
  }

  /**---------------------------------------------
    [랜덤 방 입장]
    * @param {Buffer} buffer
    * @param {LobbySession} session
---------------------------------------------*/

  randomMatchingHandler(buffer, session) {
    console.log('randomMatchingHandler');
    this.waitingQueue.push(session);
    if (this.waitingQueue.length >= 4) {
      const room = new Room(this.availableRoomIds.shift() || 0, '랜덤방', 4);
      this.rooms.set(room.id, room);
      this.waitingQueue.splice(0, 4).forEach((user) => room.enterRoom(user));

      const L2BPacket = create(L2B_CreateGameRoomRequestSchema, {
        roomId: room.id,
        maxPlayers: room.getCurrentUsersCount(),
      });
      const sendBuffer = PacketUtils.SerializePacket(
        L2BPacket,
        L2B_CreateGameRoomRequestSchema,
        ePacketId.L2B_CreateRoom,
        session.getNextSequence(),
      );
      battleSession.send(sendBuffer);
    }
  }
  // 수정 요구사항:
  // randomMatching으로 변경, 인원수 4명으로

  /**---------------------------------------------
   * [게임 시작] - 배틀서버에게 게임 방 생성 요청

    // 1. 클라 -> 로비: 게임 시작 요청
    // 2. 로비 -> 배틀: 방 생성 요청
    // 3. 배틀 -> 로비: 방 생성 완료 통지

    // 4. 로비 -> 클라: 게임 시작 응답(배틀 서버의 주소, port, gameRoomID)
    
    // 5. 클라 -> 배틀: 접속
    // 6. 클라 -> 배틀: initialPacket전송 
    // 7. 클라 -> 배틀: 방 입장 요청
    // 8. 배틀 -> 클라: 모든 유저가 접속 시 게임 시작 통지

   * @param {Buffer} buffer
   * @param {LobbySession | BattleSession} session
   ---------------------------------------------*/
  gameStartHandler(buffer, session) {
    console.log('gameStartHandler');
    const battleSession =
      battleSessionManager.getSessionOrNull('battleServerSession');

    if (!battleSession) {
      console.log('!BattleServerSession을 찾을 수 없습니다.');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, 'BattleServerSession을 찾을 수 없습니다.');
    }

    const packet = fromBinary(C2L_GameStartSchema, buffer);
    const room = this.rooms.get(packet.roomId);
    if (room == undefined) {
      console.log('방을 찾을 수 없습니다.');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, 'invalid roomId.');
    }

    const L2BPacket = create(L2B_CreateGameRoomRequestSchema, {
      roomId: packet.roomId,
      maxPlayers: room.getCurrentUsersCount(),
    });

    const sendBuffer = PacketUtils.SerializePacket(
      L2BPacket,
      L2B_CreateGameRoomRequestSchema,
      ePacketId.L2B_CreateGameRoomRequest,
      session.getNextSequence(),
    );

    console.log('내가 받은 roomId', packet.roomId);
    battleSession.send(sendBuffer);
    console.log('보내기 직후');
  }

  /**---------------------------------------------
   * [게임 시작2] - 클라에게 배틀 서버의 주소와 포트번호, 게임 방ID 전송
   * @param {Buffer} buffer
   * @param {LobbySession | BattleSession} session
   * // 4. 로비 -> 클라: 게임 시작 응답(배틀 서버의 주소, port, gameRoomID)
   * 
   * 
   ---------------------------------------------*/
  onGameStartHandler(buffer, session) {
    console.log('------------------------------');
    console.log('onGameStartHandler');
    console.log('------------------------------');

    const packet = fromBinary(B2L_CreateGameRoomResponeSchema, buffer);

    if (packet.isCreated == false) {
      console.log('onGameStartHandler: 실패');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '방 생성 실패');
    }

    const room = this.rooms.get(packet.roomId);
    if (!room) {
      console.log(this.rooms);
      console.log('onGameStartHandler: 실패');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, `유효하지 않은 roomID: ${packet.roomId}`);
    }

    const L2C_GameStartPacket = create(L2C_GameStartSchema, {
      host: lobbyConfig.battleServer.host,
      port: lobbyConfig.battleServer.port,
      roomId: packet.roomId,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      L2C_GameStartPacket,
      L2C_GameStartSchema,
      ePacketId.L2C_GameStart,
      0,
    );
    room.broadcast(sendBuffer);
  }

  /**---------------------------------------------
   * [방 ID 해제] - 사용하지 않는 방 ID를 큐에 반환하여 재사용 가능하게 만듦
   * @param {number} roomId
   ---------------------------------------------*/
  freeRoomId(roomId) {
    if (!this.rooms.has(roomId)) {
      console.log('유효하지 않은 roomID');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomID');
    }

    this.rooms.delete(roomId);
    this.availableRoomIds.push(roomId);
  }

  onSocketDisconnected(playerId) {
    console.log('onSocketDisconnected');
    for (const room of this.rooms.values()) {
      const player = room.users.find((user) => user.getId() === playerId);
      if (player) {
        room.leaveRoom(player);
        if (room.getCurrentUsersCount() <= 0) {
          this.freeRoomId(room.id);
        }
        break;
      }
    }
  }
}

export const roomManager = new RoomManager();
