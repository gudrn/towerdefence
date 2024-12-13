import { create, fromBinary } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { roomManager } from "src/contents/roomManager";
import { BattleSession } from "src/main/session/battleSession";
import { B2G_MonsterPositionUpdateNotificationSchema, B2G_SpawnMonsterNotificationSchema, G2C_MonsterPositionUpdateNotificationSchema, G2C_SpawnMonsterNotificationSchema } from "src/protocol/monster_pb";

 /*---------------------------------------------
    [몬스터 스폰]
    
  ---------------------------------------------*/
export function handleB2G_SpawnMonsterNotification(buffer: Buffer, session: BattleSession) {
    console.log("handleB2G_InitCardData");
    const packet = fromBinary(B2G_SpawnMonsterNotificationSchema, buffer);

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방을 찾지 못했습니다 ${packet.roomId}`);
    }

    //일단 그대로 보내보기
    const notificationPacket = create(G2C_SpawnMonsterNotificationSchema, {
        posInfo: packet.posInfo,
        prefabId: packet.prefabId
    });

    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_SpawnMonsterNotificationSchema, ePacketId.G2C_SpawnMonsterNotification, 0);
    room.broadcast(sendBuffer);
}

export function handleB2G_MonsterPositionUpdateNotification(buffer: Buffer, session: BattleSession) {
    console.log("handleB2G_MonsterPositionUpdateNotification");

    const packet = fromBinary(B2G_MonsterPositionUpdateNotificationSchema, buffer);

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방을 찾지 못했습니다 ${packet.roomId}`);
    }

    const notificationPacket = create(G2C_MonsterPositionUpdateNotificationSchema, {
        posInfo: packet.posInfo
    });

    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_MonsterPositionUpdateNotificationSchema, ePacketId.G2C_MonsterPositionUpdateNotification, 0);
    room.broadcast(sendBuffer);
}