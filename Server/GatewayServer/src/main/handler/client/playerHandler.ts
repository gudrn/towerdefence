import { create, fromBinary } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { roomManager } from "src/contents/roomManager";
import { GatewaySession } from "src/main/session/gatewaySession";
import { C2G_PlayerPositionUpdateRequestSchema, G2B_PlayerPositionUpdateRequestSchema } from "src/protocol/character_pb";
import { C2G_TowerBuildRequestSchema, G2B_TowerBuildRequestSchema } from "src/protocol/tower_pb";
import { battleSessionManager } from "src/server";

/*---------------------------------------------
    [이동 동기화]
    배틀 서버에 전송
  ---------------------------------------------*/
export function handleC2G_PlayerPositionUpdateRequest(buffer: Buffer, session: GatewaySession) {
    const packet = fromBinary(C2G_PlayerPositionUpdateRequestSchema, buffer);

    //이 코드를 반복해서 작성하는 중
    //getRoom에서 에러를 던지는 것까지 해야되나 고민 중
    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, "방을 찾지 못했습니다.");
    }
    const battleSession = battleSessionManager.getSessionOrNull(room.getBattleServerId());
    if(battleSession == null) {
        throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, "배틀 세션을 찾지 못했습니다.");
    }

    const requestPacket = create(G2B_PlayerPositionUpdateRequestSchema, {
        posInfo: packet.posInfo,
        roomId: packet.roomId
    });
    
    const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2B_PlayerPositionUpdateRequestSchema, ePacketId.G2B_PlayerPositionUpdateRequest, 0);
    battleSession.send(sendBuffer);
}

/*---------------------------------------------
    [타워 설치 요청]
  ---------------------------------------------*/
export function handleC2G_TowerBuildRequest(buffer: Buffer, session: GatewaySession) {
    console.log("handleC2G_TowerBuildRequest")
    const packet = fromBinary(C2G_TowerBuildRequestSchema, buffer);

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, "방을 찾지 못했습니다.");
    }
    const battleSession = battleSessionManager.getSessionOrNull(room.getBattleServerId());
    if(battleSession == null) {
        throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, "배틀 세션을 찾지 못했습니다.");
    }
    const requestPacket = create(G2B_TowerBuildRequestSchema,{
        tower: packet.tower,
        ownerId : packet.ownerId,
        roomId : packet.roomId,
        cardId : packet.cardId
    })
    const sendBuffer = PacketUtils.SerializePacket(requestPacket,G2B_TowerBuildRequestSchema,ePacketId.G2B_TowerBuildRequest,0);
    battleSession.send(sendBuffer);
}