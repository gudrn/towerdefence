import { create, fromBinary } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { roomManager } from "src/contents/roomManager";
import { BattleSession } from "src/main/session/battleSession";
import { B2G_MonsterAttackBaseNotificationSchema, B2G_MonsterAttackTowerNotificationSchema, B2G_MonsterDeathNotificationSchema, B2G_MonsterHealthUpdateNotificationSchema, B2G_MonsterPositionUpdateNotificationSchema, B2G_SpawnMonsterNotificationSchema, G2C_MonsterAttackBaseNotificationSchema, G2C_MonsterAttackTowerNotificationSchema, G2C_MonsterDeathNotificationSchema, G2C_MonsterHealthUpdateNotificationSchema, G2C_MonsterPositionUpdateNotificationSchema, G2C_SpawnMonsterNotificationSchema } from "src/protocol/monster_pb";

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

 /*---------------------------------------------
    [몬스터 이동 동기화]
  ---------------------------------------------*/
export function handleB2G_MonsterPositionUpdateNotification(buffer: Buffer, session: BattleSession) {

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

 /*---------------------------------------------
    [몬스터->타워 공격 동기화]
  ---------------------------------------------*/
export function handleB2G_MonsterAttackTowerNotification(buffer: Buffer, session: BattleSession) {
    console.log("handleB2G_MonsterAttackTowerNotification");

    const packet = fromBinary(B2G_MonsterAttackTowerNotificationSchema, buffer);

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방을 찾지 못했습니다 ${packet.roomId}`);
    }

    const notificationPacket = create(G2C_MonsterAttackTowerNotificationSchema, {
        monsterId: packet.monsterId,
        targetId: packet.targetId,
        hp: packet.hp,
        maxHp: packet.maxHp
    });

    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_MonsterAttackTowerNotificationSchema, ePacketId.G2C_MonsterPositionUpdateNotification, 0);
    room.broadcast(sendBuffer);
}

 /*---------------------------------------------
    [몬스터-> 베이스 공격 동기화]
  ---------------------------------------------*/
export function handleB2G_MonsterAttackBaseNotification(buffer: Buffer, session: BattleSession) {
    console.log("handleB2G_MonsterAttackBaseNotification");

    const packet = fromBinary(B2G_MonsterAttackBaseNotificationSchema, buffer);

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방을 찾지 못했습니다 ${packet.roomId}`);
    }

    const notificationPacket = create(G2C_MonsterAttackBaseNotificationSchema, {
        monsterId: packet.monsterId,
        attackDamage: packet.attackDamage
    });

    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_MonsterAttackBaseNotificationSchema, ePacketId.G2C_MonsterPositionUpdateNotification, 0);
    room.broadcast(sendBuffer);
}

 /*---------------------------------------------
    [몬스터 체력 업데이트]
  ---------------------------------------------*/
export function handleB2G_MonsterHealthUpdateNotification(buffer: Buffer, session: BattleSession) {
    console.log("handleB2G_MonsterHealthUpdateNotification");

    const packet = fromBinary(B2G_MonsterHealthUpdateNotificationSchema, buffer);

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방을 찾지 못했습니다 ${packet.roomId}`);
    }

    //[안건]
    //maxHP를 매번 보내줄 필요가 없어보입니다.
    //몬스터 스폰 시 최대 체력을 보내줄 텐데, 클라에서 최대 체력을 따로 저장 후 사용하는 게 좋아보입니다.
    //-조정현(12/3)
    const notificationPacket = create(G2C_MonsterHealthUpdateNotificationSchema, {
        monsterId: packet.monsterId,
        hp: packet.hp,
        maxHp: packet.maxHp
    });

    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_MonsterHealthUpdateNotificationSchema, ePacketId.G2C_MonsterPositionUpdateNotification, 0);
    room.broadcast(sendBuffer);
}

/*---------------------------------------------
    [몬스터 처치 알림]
  ---------------------------------------------*/
export function handleB2G_MonsterDeathNotification(buffer: Buffer, session: BattleSession) {
    console.log("handleB2G_MonsterDeathNotification");

    const packet = fromBinary(B2G_MonsterDeathNotificationSchema, buffer);

    const room = roomManager.getRoom(packet.roomId);
    if(room == undefined) {
        throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `방을 찾지 못했습니다 ${packet.roomId}`);
    }

    const notificationPacket = create(G2C_MonsterDeathNotificationSchema, {
        monsterId: packet.monsterId,
        score: packet.score,
    });

    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, G2C_MonsterDeathNotificationSchema, ePacketId.G2C_MonsterDeathNotification, 0);
    room.broadcast(sendBuffer);
}

