import { create, fromBinary } from "@bufbuild/protobuf";
import { GatewaySession } from "../../session/gatewaySession";
import { B2G_CreateGameRoomResponseSchema, B2G_DeleteGameRoomRequestSchema, B2G_GameStartNotificationSchema, C2G_CreateRoomRequest, C2G_CreateRoomRequestSchema, C2G_GetRoomListRequestSchema, C2G_JoinRoomRequest, C2G_JoinRoomRequestSchema, G2B_CreateGameRoomRequestSchema, G2C_CreateGameRoomNotificationSchema, G2C_GameStartNotificationSchema, G2L_CreateRoomRequestSchema, G2L_DeleteGameRoomRequestSchema, G2L_GameStartRequestSchema, G2L_GetRoomListRequestSchema, G2L_JoinRoomRequestSchema } from "src/protocol/room_pb";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { battleSessionManager, lobbySessionManager } from "src/server";
import { redis } from "src/utils/redis";
import { handleError } from "src/utils/errorHandler";
import { roomManager } from "src/contents/roomManager";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { BattleSession } from "src/main/session/battleSession";

/*---------------------------------------------
    [배틀서버 패킷 처리]
  ---------------------------------------------*/


  /*---------------------------------------------
    [방 생성 응답]
    로비 서버에게 방 정보 요청
    게이트웨이 서버는 redis에 접근X
  ---------------------------------------------*/
export function handleB2G_CreateGameRoomResponse(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(B2G_CreateGameRoomResponseSchema, buffer);

    const notificationPacket = create(G2C_CreateGameRoomNotificationSchema, {
        serverId: session.getId()
    });

    const sendBuffer = PacketUtils.SerializePacket(
        notificationPacket,
        G2C_CreateGameRoomNotificationSchema,
        ePacketId.G2C_CreateGameRoomNotification,
        0
    );

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, "[handleB2G_CreateGameRoomResponse] 방을 찾지 못했습니다.");
    }

    //배틀 서버 아이디 방에 등록
    room.setBattleServerd(session.getId());

    room.broadcast(sendBuffer);
}

export function handleB2G_JoinGameRoomResponse(buffer: Buffer, session: GatewaySession) {

}

export function handleB2G_GameStartNotification(buffer: Buffer, session: GatewaySession) {
    console.log("게임 시작!");

    const packet = fromBinary(B2G_GameStartNotificationSchema, buffer);
    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방을 찾지 못했습니다. ${packet.roomId}`);
    }    

    const notificationPacket = create(G2C_GameStartNotificationSchema, {
        obstaclePosInfos: packet.obstaclePosInfos,
        playerDatas: packet.playerDatas,
    });

    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_GameStartNotificationSchema, ePacketId.G2C_GameStartNotification, 0);
    room.broadcast(sendBuffer);
}

/*---------------------------------------------
    [방 제거 요청]
    로비 서버에게 방 제거 요청
    자신의 room도 제거
  ---------------------------------------------*/
export function handleB2G_DeleteGameRoomRequest(buffer: Buffer, session: GatewaySession){
    console.log("handleB2G_DeleteGameRoomRequest");

    
    const packet = fromBinary(B2G_DeleteGameRoomRequestSchema, buffer);
    
    //1. 로비 서버에게 방 제거 요청
    {
        const lobbySession = lobbySessionManager.getRandomSession();
        if(lobbySession == null){
            throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, "로비 세션을 찾지 못했습니다.");
        }
        const requestPacket = create(G2L_DeleteGameRoomRequestSchema, {
            roomId: packet.roomId,
        });
    
        const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2L_DeleteGameRoomRequestSchema, ePacketId.G2L_DeleteGameRoomRequest, 0);
        lobbySession.send(sendBuffer);
    }
    //자신의 room도 제거
    roomManager.deleteRoom(packet.roomId);

}