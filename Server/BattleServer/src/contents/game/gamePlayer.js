import { BattleSession } from '../../main/session/battleSession.js';
import { v4 as uuidv4 } from 'uuid';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { create } from 'protobufjs';
import { assetManager } from '../../utils/assetManager.js';
import { B2C_InitCardDataSchema, B2C_AddCardNotificationSchema, C2B_SkillResponseSchema } from '../../protocol/skill_pb.js';

export class GamePlayer {
  /**
   * @param {BattleSession} session - 플레이어의 세션 정보
   * @param {GamePlayerData} playerData - 플레이어의 정보 객체
   */
  constructor(session, playerData) {
    this.session = session;
    this.playerData = playerData;
    this.cardList = new Map();
  }

  randomCard() {
    // 포탑 카드를 무조건 하나 추가
    const turretCardId = 4;
    const turretCard = assetManager.getCardData(turretCardId);
    const turretUuid = uuidv4();
    this.cardList.set(turretUuid, turretCard);

    for (let i = 0; i < 3; i++) { // 나머지 3개의 카드를 랜덤으로 추가
      const cardId = Math.floor(Math.random() * assetManager.cards.size) + 1;
      const card = assetManager.getCardData(cardId).name;
      const uuid = uuidv4();
      this.cardList.set(uuid, card);
    }

    const packet = create(B2C_InitCardDataSchema, {
      cardData: Array.from(this.cardList.values()),
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2C_InitCardDataSchema,
      ePacketId.B2C_InitCardData,
      this.session.getNextSequence(),
    );

    this.session.send(sendBuffer);
  }
  /**
   * 카드 랜덤으로 하나 추가
   */
  addCard() {
    const cardId = Math.floor(Math.random() * assetManager.cards.size) + 1;
    const card = assetManager.getCardData(cardId);
    const uuid = uuidv4();
    this.cardList.set(uuid, card);

    const packet = create(B2C_AddCardNotificationSchema, {
      cardId: uuid,
      prefabId: card.cardType,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2C_AddCardNotificationSchema,
      ePacketId.B2C_AddCardNotification,
      this.session.getNextSequence(),
    );

    this.session.send(sendBuffer);
  }

  useCard(cardId) {
    const card = this.cardList.get(cardId);
    if (!card) return;
    this.cardList.delete(cardId);

    const responsePacket = create(C2B_SkillResponseSchema, {
      isSuccess: true,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      responsePacket,
      C2B_SkillResponseSchema,
      ePacketId.B2C_SkillResponse,
      this.session.getNextSequence(),
    );

    this.session.send(sendBuffer);
  }
}
