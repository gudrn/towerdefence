import { create } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { B2C_BaseDestroyNotificationSchema } from "src/protocol/tower_pb";

export const createOnDestroyed = (isDestroied: boolean = true) => {
    const baseDestroyedPacket = create(B2C_BaseDestroyNotificationSchema, {
        isDestroied
    });

    const baseDestroyedBuffer = PacketUtils.SerializePacket(
        baseDestroyedPacket,
        B2C_BaseDestroyNotificationSchema,
        ePacketId.B2C_BaseDestroyNotification,
        0, //수정 부분
    );
    return baseDestroyedBuffer
}