import { create, fromBinary } from "@bufbuild/protobuf";
import { C2G_CreateRoomRequest, C2G_CreateRoomRequestSchema, C2G_GetRoomListRequestSchema, G2C_CreateRoomResponseSchema, G2C_GetRoomListResponseSchema, G2C_JoinRoomNotificationSchema, G2C_JoinRoomResponseSchema, G2L_GetRoomListRequestSchema, L2G_CreateRoomResponseSchema, L2G_GetRoomListResponseSchema, L2G_JoinRoomNotificationSchema, L2G_JoinRoomResponseSchema } from "src/protocol/room_pb";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { gatewaySessionManager, lobbySessionManager } from "src/server";
import { redis } from "src/utils/redis";
import { handleError } from "src/utils/errorHandler";
import { LobbySession } from "src/main/session/lobbySession";
import { lobbyConfig, roomConfig } from 'src/config/config';
import { RoomData, RoomDataSchema } from "src/protocol/struct_pb";

/*---------------------------------------------
    [방 정보 응답]
  ---------------------------------------------*/
export function handleL2G_GetRoomListResponse(buffer: Buffer, session: LobbySession) {
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
export function handleL2G_CreateRoomResponse(buffer: Buffer, session: LobbySession) {
    console.log("handleL2G_CreateRoomResponse");

    const packet = fromBinary(L2G_CreateRoomResponseSchema, buffer);
    console.log(packet.userId);
    const clientSession = gatewaySessionManager.getSessionOrNull(packet.userId);
    if(clientSession == null) {
        console.log("[handleL2G_CreateRoomResponse] 클라이언트가 유효하지 않습니다.");
        return;
    }

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
  export function handleL2G_JoinRoomResponse(buffer: Buffer, session: LobbySession) {
    console.log("handleL2G_JoinRoomResponse");

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
}

/*---------------------------------------------
    [방 입장 알림]
    - redis에 접근하여 room에 있는 유저들의 id값을 가져오기
    - 해당 id값을 통해 sessionManager로부터 session을 가져와 broadcast
  ---------------------------------------------*/
  export async function handleL2G_JoinRoomNotification(buffer: Buffer, session: LobbySession) {
    console.log("handleL2G_JoinRoomNotification");

    const packet = fromBinary(L2G_JoinRoomNotificationSchema, buffer);
    const notificationPacket = create(G2C_JoinRoomNotificationSchema, {
        joinUser: packet.joinUser
    });

    // 1. 방 ID를 통해 해당 방을 가져오기
    const roomKey = `${roomConfig.ROOM_KEY}${packet.roomId}`;
    const serializedRoomData = await redis.getBuffer(roomKey);
    
    if (serializedRoomData == null) return;
    

    //2. 해당 id값을 통해 sessionManager로부터 session을 가져와 broadcast
    const roomData: RoomData = fromBinary(RoomDataSchema, serializedRoomData);
    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_JoinRoomNotificationSchema, ePacketId.G2C_JoinRoomNotification, 0);

    for(let user of roomData.users) {
        const clientSession = gatewaySessionManager.getSessionOrNull(user.id);
        if(clientSession == null) continue;

        clientSession.send(sendBuffer);
    }

    
}