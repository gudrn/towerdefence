import { create, fromBinary } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { roomManager } from "src/contents/roomManager";
import { BattleSession } from "src/main/session/battleSession";
import { B2G_TowerAttackMonsterNotificationSchema, B2G_TowerBuildNotificationSchema, B2G_TowerDestroyNotificationSchema, B2G_TowerHealthUpdateNotificationSchema, G2C_TowerAttackMonsterNotificationSchema, G2C_TowerBuildNotificationSchema, G2C_TowerDestroyNotificationSchema, G2C_TowerHealthUpdateNotificationSchema } from "src/protocol/tower_pb";

/*---------------------------------------------
    [타워 생성 알림]
  ---------------------------------------------*/
export function handleB2G_TowerBuildNotification(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(B2G_TowerBuildNotificationSchema, buffer);

    const notificationPacket = create(G2C_TowerBuildNotificationSchema, {
        ownerId: packet.ownerId,
        tower: packet.tower
    });

    const sendBuffer = PacketUtils.SerializePacket(
        notificationPacket,
        G2C_TowerBuildNotificationSchema,
        ePacketId.G2C_TowerBuildNotification,
        0
    );

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, "[handleB2G_TowerBuildNotification] 방을 찾지 못했습니다.");
    }

    room.broadcast(sendBuffer);
}

/*---------------------------------------------
    [타워 파괴 알림]
  ---------------------------------------------*/
export function handleB2G_TowerDestroyNotification(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(B2G_TowerDestroyNotificationSchema, buffer);

    const notificationPacket = create(G2C_TowerDestroyNotificationSchema, {
        isSuccess: packet.isSuccess,
        towerId: packet.towerId
    });

    const sendBuffer = PacketUtils.SerializePacket(
        notificationPacket,
        G2C_TowerDestroyNotificationSchema,
        ePacketId.G2C_TowerDestroyNotification,
        0
    );

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, "[handleB2G_TowerDestroyNotification] 방을 찾지 못했습니다.");
    }

    room.broadcast(sendBuffer);
}

/*---------------------------------------------
    [타워 체력 업데이트]
  ---------------------------------------------*/
export function handleB2G_TowerHealthUpdateNotification(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(B2G_TowerHealthUpdateNotificationSchema, buffer);

    const notificationPacket = create(G2C_TowerHealthUpdateNotificationSchema, {
        hp: packet.hp,
        maxHp: packet.maxHp,
        towerId: packet.towerId
    });

    const sendBuffer = PacketUtils.SerializePacket(
        notificationPacket,
        G2C_TowerHealthUpdateNotificationSchema,
        ePacketId.G2C_TowerHealthUpdateNotification,
        0
    );

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, "[handleB2G_TowerBuildNotification] 방을 찾지 못했습니다.");
    }

    room.broadcast(sendBuffer);
}

/*---------------------------------------------
    [타워->몬스터 공격 알림]
  ---------------------------------------------*/
export function handleB2G_TowerAttackMonsterNotification(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(B2G_TowerAttackMonsterNotificationSchema, buffer);

    const notificationPacket = create(G2C_TowerAttackMonsterNotificationSchema, {
        towerId: packet.towerId,
        monsterPos: packet.monsterPos,
        travelTime: packet.travelTime
    });

    const sendBuffer = PacketUtils.SerializePacket(
        notificationPacket,
        G2C_TowerAttackMonsterNotificationSchema,
        ePacketId.G2C_TowerAttackMonsterNotification,
        0
    );

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, "[handleB2G_TowerAttackMonsterNotification] 방을 찾지 못했습니다.");
    }

    room.broadcast(sendBuffer);
}