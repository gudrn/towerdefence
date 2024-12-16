import { fromBinary, create } from '@bufbuild/protobuf';
import { Room } from './room';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { handleError } from 'src/utils/errorHandler';
import { RoomDataSchema } from 'src/protocol/struct_pb';
import { ePacketId } from 'ServerCore/network/packetId';
import { BattleSession } from 'src/main/session/battleSession';
import { LobbySession } from 'src/main/session/lobbySession';
import { G2C_CreateRoomResponseSchema, G2C_GetRoomListResponseSchema, G2C_JoinRoomNotificationSchema, G2C_JoinRoomResponseSchema, L2G_CreateRoomResponseSchema, L2G_GetRoomListResponseSchema, L2G_JoinRoomNotificationSchema, L2G_JoinRoomResponseSchema } from 'src/protocol/room_pb';
import { gatewaySessionManager } from 'src/server';

class RoomManager {
  /*---------------------------------------------
  [멤버 변수]
---------------------------------------------*/
  private rooms: Map<number, Room>  = new Map<number, Room>();

  constructor() {
    this.rooms = new Map<number, Room>();
  }

  /*---------------------------------------------
    [방 정보 응답]
  ---------------------------------------------*/
  public handleL2G_GetRoomListResponse(buffer: Buffer, session: LobbySession) {
  const packet = fromBinary(L2G_GetRoomListResponseSchema, buffer);

  const clientSession = gatewaySessionManager.getSessionOrNull(packet.userId);
  if(clientSession == null) {
      console.log("[handleL2G_GetRoomListResponse] 클라이언트가 유효하지 않습니다.");
      console.log(packet.userId);
      return;
  }

  const responsePacket = create(G2C_GetRoomListResponseSchema, {
      rooms: packet.rooms
  });

  const sendBuffer = PacketUtils.SerializePacket(responsePacket, G2C_GetRoomListResponseSchema, ePacketId.G2C_GetRoomListResponse, 0);
  clientSession.send(sendBuffer);
}

/*---------------------------------------------
  [방 생성 응답]
---------------------------------------------*/
  public handleL2G_CreateRoomResponse(buffer: Buffer, session: LobbySession) {

    const packet = fromBinary(L2G_CreateRoomResponseSchema, buffer);
    console.log(packet.userId);
    const clientSession = gatewaySessionManager.getSessionOrNull(packet.userId);
    if(clientSession == null) {
        console.log("[handleL2G_CreateRoomResponse] 클라이언트가 유효하지 않습니다.");
        return;
    }

    //로비 서버에서 검사하고 넘겨줄텐데 꼭 검사가 필요할까요?
    if(this.rooms.get(packet.room!.id) != undefined) {
      throw new CustomError(ErrorCodes.ALREADY_USED_ROOM, "이미 생성된 방");
    }

    //방 생성
    this.rooms.set(packet.room!.id, new Room(packet.room!.id, packet.room!.maxUserNum));

    const responsePacket = create(G2C_CreateRoomResponseSchema, {
        isSuccess: packet.isSuccess,
        room: packet.room
    });

    const sendBuffer = PacketUtils.SerializePacket(responsePacket, G2C_CreateRoomResponseSchema, ePacketId.G2C_CreateRoomResponse, 0);
    clientSession.send(sendBuffer);
  }

  /*---------------------------------------------
    [방 입장 응답]
  ---------------------------------------------*/
  public handleL2G_JoinRoomResponse(buffer: Buffer, session: LobbySession) {
    const packet = fromBinary(L2G_JoinRoomResponseSchema, buffer);
    
    const clientSession = gatewaySessionManager.getSessionOrNull(packet.userId);
    if(clientSession == null) {
        console.log("[handleL2G_CreateRoomResponse] 클라이언트가 유효하지 않습니다.");
        return;
    }

    const responsePacket = create(G2C_JoinRoomResponseSchema, {
        isSuccess: packet.isSuccess,
        roomInfo: packet.roomInfo
    });

    const sendBuffer = PacketUtils.SerializePacket(responsePacket, G2C_JoinRoomResponseSchema, ePacketId.G2C_JoinRoomResponse, 0);
    clientSession.send(sendBuffer);

    const room = this.rooms.get(packet.roomInfo!.id);
    room!.handleL2G_JoinRoomResponse(clientSession);
  }

  /*---------------------------------------------
    [방 입장 알림]
  ---------------------------------------------*/
  public handleL2G_JoinRoomNotification(buffer: Buffer, session: LobbySession) {
    //console.log("handleL2G_JoinRoomNotification");

    const packet = fromBinary(L2G_JoinRoomNotificationSchema, buffer);
    
    const room = this.rooms.get(packet.roomId);
    if(room == undefined) {
      console.log('방을 찾을 수 없습니다.');
      throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, 'invalid roomId');
    }
    
    const notificationPacket = create(G2C_JoinRoomNotificationSchema, {
        joinUser: packet.joinUser
    });
    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_JoinRoomNotificationSchema, ePacketId.G2C_JoinRoomNotification, 0);
    room.broadcast(sendBuffer);
  }

  public getRoom(roomId: number) {
    return this.rooms.get(roomId);
  }

  public deleteRoom(roomId: number){
    const room = this.rooms.get(roomId);
    if (room == undefined) {
      console.log('유효하지 않은 roomID');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, `유효하지 않은 roomID ${roomId}`);
    }

    this.rooms.delete(roomId);
  }
}

export const roomManager = new RoomManager();
