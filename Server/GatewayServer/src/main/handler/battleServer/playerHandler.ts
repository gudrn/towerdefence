import { B2G_PlayerPositionUpdateNotification } from './../../../../../BattleServer/src/protocol/character_pb';
import { create, fromBinary } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { roomManager } from "src/contents/roomManager";
import { BattleSession } from "src/main/session/battleSession";
import { B2G_PlayerPositionUpdateNotificationSchema, C2G_PlayerPositionUpdateRequestSchema, G2B_PlayerPositionUpdateRequestSchema, G2C_PlayerPositionUpdateNotificationSchema } from "src/protocol/character_pb";
import { battleSessionManager } from "src/server";

/*---------------------------------------------
    [이동 동기화]
    배틀 서버에 전송
  ---------------------------------------------*/
export function handleB2G_PlayerPositionUpdateNotification(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(B2G_PlayerPositionUpdateNotificationSchema, buffer);

    //이 코드를 반복해서 작성하는 중
    //getRoom에서 에러를 던지는 것까지 해야되나 고민 중
    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방을 찾지 못했습니다 ${packet.roomId}`);
    }
    
    const notificationPacket = create(G2C_PlayerPositionUpdateNotificationSchema, {
        posInfo: packet.posInfo,
    });
    
    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_PlayerPositionUpdateNotificationSchema, ePacketId.G2C_PlayerPositionUpdateNotification, 0);
    room.broadcast(sendBuffer);
}