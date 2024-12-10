import { create, fromBinary } from "@bufbuild/protobuf";
import { GatewaySession } from "../../session/gatewaySession";
import { C2G_CreateRoomRequest, C2G_CreateRoomRequestSchema, C2G_GetRoomListRequestSchema, C2G_JoinRoomRequest, C2G_JoinRoomRequestSchema, G2L_CreateRoomRequestSchema, G2L_GetRoomListRequestSchema, G2L_JoinRoomRequestSchema } from "src/protocol/room_pb";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { lobbySessionManager } from "src/server";
import { redis } from "src/utils/redis";
import { handleError } from "src/utils/errorHandler";

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
    console.log("handleC2G_JoinRoomRequest");

    const packet: C2G_JoinRoomRequest = fromBinary(C2G_JoinRoomRequestSchema, buffer);

    const requestPacket = create(G2L_JoinRoomRequestSchema, {
        roomId: packet.roomId,
        nickname: packet.nickname,
        userId: session.getId()
    });

    const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2L_JoinRoomRequestSchema, ePacketId.G2L_JoinRoomRequest, 0);

    const lobbySession = lobbySessionManager.getRandomSession();
    if(lobbySession == null) {
        console.log("[handleC2G_JoinRoomRequest]: 로비 세션이 존재하지 않습니다.");
        return;
    }

    lobbySession.send(sendBuffer);
}

