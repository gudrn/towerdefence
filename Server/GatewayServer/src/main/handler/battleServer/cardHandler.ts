import { CustomError } from 'ServerCore/utils/error/customError';
import { create, fromBinary } from "@bufbuild/protobuf";
import { BattleSession } from "src/main/session/battleSession";
import { B2G_AddCardSchema, B2G_InitCardDataSchema, G2C_AddCardSchema, G2C_InitCardDataSchema } from "src/protocol/skill_pb";
import { gatewaySessionManager } from "src/server";
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';

 /*---------------------------------------------
    [초기 카드]
  ---------------------------------------------*/
export function handleB2G_InitCardData(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(B2G_InitCardDataSchema, buffer);

    const gatewaySession = gatewaySessionManager.getSessionOrNull(packet.userId);
    if(gatewaySession == null) {
        throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, "게이트웨이 세션을 찾지 못했습니다.");
    }

    //일단 그대로 보내보기
    const responsePacket = create(G2C_InitCardDataSchema, {
        cardData: packet.cardData
    });

    const sendBuffer = PacketUtils.SerializePacket(responsePacket, G2C_InitCardDataSchema, ePacketId.G2C_InitCardData, 0);
    gatewaySession.send(sendBuffer);
}

 /*---------------------------------------------
    [카드 추가]
  ---------------------------------------------*/
export function handleB2G_AddCard(buffer: Buffer,session: BattleSession){
    const packet = fromBinary(B2G_AddCardSchema,buffer);

    const gatewaySession=gatewaySessionManager.getSessionOrNull(packet.userId);
    if(gatewaySession == null){
        throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, "게이트웨이 세션을 찾지 못했습니다.");
    }

    const responsePacket = create(G2C_AddCardSchema,{
        cardData: packet.cardData
    })
    const sendBuffer = PacketUtils.SerializePacket(responsePacket,G2C_AddCardSchema,ePacketId.G2C_AddCard,0);
    gatewaySession.send(sendBuffer);
}