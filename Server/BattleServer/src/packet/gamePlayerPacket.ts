import { create } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { B2C_AddCardSchema, B2C_InitCardDataSchema, B2C_UseSkillNotificationSchema } from "src/protocol/skill_pb";
import { CardDataSchema, SkillDataSchema } from "src/protocol/struct_pb";

export const createInitCard = (
    cardDatas: any,
    getNextSequence: () => number
    ) => {
    const packet = create(B2C_InitCardDataSchema, {
    cardData: cardDatas,
    });
  
    const sendBuffer = PacketUtils.SerializePacket(
    packet,
    B2C_InitCardDataSchema,
    ePacketId.B2C_InitCardData,
    getNextSequence(),
    );
    return sendBuffer
}

export const createAddRandomCard = (
    card: {cardId: string; prefabId: string}[],
    getNextSequence: () => number,
    ) => {
    const packet = create(B2C_AddCardSchema, {
        cardData: create(CardDataSchema, {cardId: card[0].cardId, prefabId: card[0].prefabId})
    });
  
      const sendBuffer = PacketUtils.SerializePacket(
        packet,
        B2C_AddCardSchema,
        ePacketId.B2C_AddCard,
        getNextSequence(),
    );
    return sendBuffer
}

export const createUseCard = (
    prefabId: string,
    getNextSequence: () => number,
    ) => {
    const responsePacket = create(B2C_UseSkillNotificationSchema, {
        skill: create(SkillDataSchema, {
          prefabId
        })
    });
  
    const sendBuffer = PacketUtils.SerializePacket(
        responsePacket,
        B2C_UseSkillNotificationSchema,
        ePacketId.B2C_SkillResponse,
        getNextSequence(),
    );
    return sendBuffer
}