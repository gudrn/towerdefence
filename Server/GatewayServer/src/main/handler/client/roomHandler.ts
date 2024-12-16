import { create, fromBinary } from "@bufbuild/protobuf";
import { GatewaySession } from "../../session/gatewaySession";
import { C2G_CreateRoomRequest, C2G_CreateRoomRequestSchema, C2G_GetRoomListRequestSchema, C2G_JoinGameRoomRequestSchema, C2G_JoinRoomRequest, C2G_JoinRoomRequestSchema, G2B_CreateGameRoomRequestSchema, G2B_JoinGameRoomRequestSchema, G2L_CreateRoomRequestSchema, G2L_GameStartRequestSchema, G2L_GetRoomListRequestSchema, G2L_JoinRoomRequestSchema } from "src/protocol/room_pb";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { battleSessionManager, lobbySessionManager } from "src/server";
import { redis } from "src/utils/redis";
import { handleError } from "src/utils/errorHandler";
import { roomManager } from "src/contents/roomManager";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";

/*---------------------------------------------
    [클라이언트 패킷 처리]
  ---------------------------------------------*/


  /*---------------------------------------------
    [방 정보 요청]
    로비 서버에게 방 정보 요청
    게이트웨이 서버는 redis에 접근X
  ---------------------------------------------*/
export function handleC2G_GetRoomListRequest(buffer: Buffer, session: GatewaySession) {
    console.log("getRoomsHandler");
    try{
        const packet = create(G2L_GetRoomListRequestSchema, { 
            userId: session.getId()
        });

        console.log("[handleC2G_GetRoomListRequest]", packet.userId)

        const sendBuffer = PacketUtils.SerializePacket(
            packet,
            G2L_GetRoomListRequestSchema,
            ePacketId.G2L_GetRoomListRequest,
            session.getSequence()
        );
        const lobbySession = lobbySessionManager.getRandomSession();
        if(lobbySession == null) {
            console.log("[getRoomsHandler]: 로비 세션이 존재하지 않습니다.");
            return;
        }
        lobbySession.send(sendBuffer);
    }
    catch(error: any) {
        console.log("실패");
    }

}

/*---------------------------------------------
    [방 생성 요청]
    로비 서버에게 방 생성 요청
    게이트웨이 서버는 redis에 접근X
  ---------------------------------------------*/
export function handleC2G_CreateRoomRequest(buffer: Buffer, session: GatewaySession) {
    console.log("createRoomHandler");

    const packet: C2G_CreateRoomRequest = fromBinary(C2G_CreateRoomRequestSchema, buffer);

    const requestPacket = create(G2L_CreateRoomRequestSchema, {
        name: packet.name,
        maxUserNum: packet.maxUserNum,
        userId: session.getId()
    });

    const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2L_CreateRoomRequestSchema, ePacketId.G2L_CreateRoomRequest, 0);

    const lobbySession = lobbySessionManager.getRandomSession();
    if(lobbySession == null) {
        console.log("[getRoomsHandler]: 로비 세션이 존재하지 않습니다.");
        return;
    }

    lobbySession.send(sendBuffer);
}

/*---------------------------------------------
    [방 입장 요청]
    로비 서버에게 방 생성 요청
  ---------------------------------------------*/
export function handleC2G_JoinRoomRequest(buffer: Buffer, session: GatewaySession) {

    const packet: C2G_JoinRoomRequest = fromBinary(C2G_JoinRoomRequestSchema, buffer);

    const requestPacket = create(G2L_JoinRoomRequestSchema, {
        roomId: packet.roomId,
        nickname: packet.nickname,
        prefabId: packet.prefabId,
        userId: session.getId(),
    });

    const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2L_JoinRoomRequestSchema, ePacketId.G2L_JoinRoomRequest, 0);

    const lobbySession = lobbySessionManager.getRandomSession();
    if(lobbySession == null) {
        console.log("[handleC2G_JoinRoomRequest]: 로비 세션이 존재하지 않습니다.");
        return;
    }

    lobbySession.send(sendBuffer);
}

/*---------------------------------------------
    [게임 시작 요청]
    1. 로비 서버에게 방 상태 변경 요청
    2. 배틀 서버에게 방 생성 요청
  ---------------------------------------------*/
export function handleC2G_GameStartRequest(buffer: Buffer, session: GatewaySession) {
    //console.log("handleC2G_GameStartRequest");

    const packet: C2G_JoinRoomRequest = fromBinary(C2G_JoinRoomRequestSchema, buffer);
    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `[handleC2G_GameStartRequest] 방을 찾지 못했습니다. ${packet.roomId}`);
    }

    //1. 로비 서버에게 방 상태 변경 요청
    {
        const requestPacket = create(G2L_GameStartRequestSchema, {
            roomId: packet.roomId,
            userId: session.getId()
        });
    
        const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2L_GameStartRequestSchema, ePacketId.G2L_GameStartRequest, 0);
    
        const lobbySession = lobbySessionManager.getRandomSession();
        if(lobbySession == null) {
            console.log("[handleC2G_GameStartRequest]: 로비 세션이 존재하지 않습니다.");
            return;
        }
    
        lobbySession.send(sendBuffer);
    }

    // 2. 배틀 서버에게 방 생성 요청
    {
        const requestPacket = create(G2B_CreateGameRoomRequestSchema, {
            roomId: packet.roomId,
            maxUserNum: room.getCurrentPlayerCount()
        });

        const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2B_CreateGameRoomRequestSchema, ePacketId.G2B_CreateGameRoomRequest, 0);

        const battleSession = battleSessionManager.getRandomSession();
        if(battleSession == null) {
            console.log("[handleC2G_GameStartRequest]: 배틀 세션이 존재하지 않습니다.");
            return;
        }

        battleSession.send(sendBuffer);
    }
}

/*---------------------------------------------
    [게임 방 입장 요청]
        - 배틀 서버에게 방 입장 요청
  ---------------------------------------------*/
export function handleC2G_JoinGameRoomRequest(buffer: Buffer, session: GatewaySession) {
    console.log("handleC2G_JoinGameRoomRequest");

    const packet = fromBinary(C2G_JoinGameRoomRequestSchema, buffer);
    
    const battleSession = battleSessionManager.getSessionOrNull(packet.serverId);

    if(battleSession == null) {
        throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, `[handleC2G_JoinGameRoomRequest] 배틀 세션을 찾지 못했습니다. ${packet.serverId}`);
    }

    const requestPacket = create(G2B_JoinGameRoomRequestSchema, {
        roomId: packet.roomId,
        playerData: packet.playerData
    });

    const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2B_JoinGameRoomRequestSchema, ePacketId.G2B_JoinGameRoomRequest, 0);

    battleSession.send(sendBuffer);
}