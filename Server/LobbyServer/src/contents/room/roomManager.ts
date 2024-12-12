import { fromBinary, create } from '@bufbuild/protobuf';
import { Room } from './room';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import {
  B2L_CreateGameRoomResponeSchema,
  B2L_SocketDisconnectedNotificationSchema,
  C2L_CreateRoomRequestSchema,
  C2L_GameStartSchema,
  C2L_JoinRoomRequestSchema,
  C2L_LeaveRoomRequestSchema,
  L2B_CreateGameRoomRequestSchema,
  L2C_CreateRoomResponseSchema,
  L2C_GameStartSchema,
  L2C_GetRoomListResponseSchema,
} from 'src/protocol/room_pb';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { handleError } from 'src/utils/errorHandler';
import { RoomDataSchema } from 'src/protocol/struct_pb';
import { ePacketId } from 'ServerCore/network/packetId';
import { LobbySession } from 'src/main/session/lobbySession';
import { battleSessionManager } from 'src/server';
import { lobbyConfig } from 'src/config/config';
import { BattleSession } from 'src/main/session/battleSession';

const MAX_ROOMS_SIZE = 10000;

class RoomManager {
  /*---------------------------------------------
  [멤버 변수]
---------------------------------------------*/
  private rooms: Map<number, Room> = new Map<number, Room>();
  private availableRoomIds: Array<number>;

  constructor() {
    this.rooms = new Map<number, Room>();
    this.availableRoomIds = Array.from({ length: MAX_ROOMS_SIZE }, (_, i) => i + 1);
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
    if (roomId == undefined) {
      handleError(session, new CustomError(ErrorCodes.SOCKET_ERROR, '방 id부족'));
      return;
    }
    this.rooms.set(roomId, new Room(roomId, packet.name, packet.maxUserNum));

    const response = create(L2C_CreateRoomResponseSchema, {
      isSuccess: true,
      room: create(RoomDataSchema, {
        id: roomId,
        name: packet.name,
      }),
    });

    const sendBuffer = PacketUtils.SerializePacket(
      response,
      L2C_CreateRoomResponseSchema,
      ePacketId.L2C_CreateRoomResponse,
      0,
    );
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

  /*---------------------------------------------
    [방 퇴장]
---------------------------------------------*/
  leaveRoomHandler(buffer: Buffer, session: LobbySession) {
    console.log('leaveRoomHandler');

    const packet = fromBinary(C2L_LeaveRoomRequestSchema, buffer);

    const room = this.rooms.get(packet.roomId);
    if (room == undefined) {
      console.log('방을 찾을 수 없습니다.');
      console.log(packet.roomId);
      throw new CustomError(ErrorCodes.SOCKET_ERROR, 'invalid roomId.');
    }

    room.leaveRoom(session);

    if (room.getCurrentUsersCount() <= 0) {
      this.freeRoomId(packet.roomId);
      console.log('방 해제 및 재등록 됨');
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
        state: room.getRoomState(),
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
    const battleSession = battleSessionManager.getSessionOrNull('battleServerSession');

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

  /*---------------------------------------------
   [게임 시작2] - 클라에게 배틀 서버의 주소와 포트번호, 게임 방ID 전송
  ---------------------------------------------*/
  onGameStartHandler(buffer: Buffer, session: BattleSession) {
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
  onSocketDisconnectedHandler(buffer, session) {
    console.log('onSocketDisconnectedHandler');
    const packet = fromBinary(B2L_SocketDisconnectedNotificationSchema, buffer);
    this.onSocketDisconnected(packet.sessionId);
  }

  /**---------------------------------------------
   * [소켓 연결 종료 처리]
   * @param {string} playerId
   ---------------------------------------------*/
  onSocketDisconnected(playerId) {
    console.log('onSocketDisconnected');
    for (const room of this.rooms.values()) {
      const player = room.getUser(playerId);
      if (player) {
        room.leaveRoom(player);
        if (room.getCurrentUsersCount() <= 0) {
          this.freeRoomId(room.getRoomId());
        }
        break;
      }
    }
  }

  //   /**
  //  * 채팅 기능
  //  */
  //   chat(session, buffer) {
  //     const chatPacket = fromBinary(C2L_chat, buffer);
  //     const room = this.rooms.get(chatPacket.roomId);
  //     room.sendChat(session, chatPacket.message)
  //   }
}

export const roomManager = new RoomManager();
