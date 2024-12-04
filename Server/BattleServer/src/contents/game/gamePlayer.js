import { BattleSession } from '../../main/session/battleSession.js';
import { v4 as uuidv4 } from 'uuid';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { assetManager } from '../../utils/assetManager.js';
import {
  B2C_InitCardDataSchema,
  B2C_UseSkillNotificationSchema,
  B2C_AddCardSchema,
} from '../../protocol/skill_pb.js';
import { create } from '@bufbuild/protobuf';
import { CardDataSchema } from '../../protocol/struct_pb.js';

export class GamePlayer {
  /**
   * @param {BattleSession} session - 플레이어의 세션 정보
   * @param {GamePlayerData} playerData - 플레이어의 정보 객체
   */
  constructor(session, playerData, gameRoom) {
    this.session = session;
    this.playerData = playerData;
    this.gameRoom = gameRoom;
    this.cardList = new Map();
  }
  /**
   * ---------------------------------------------
   * [randomCard]
   * - 카드 랜덤으로 하나 추가
   * ---------------------------------------------
   */
  initCard() {
    // 포탑 카드를 무조건 하나 추가
    const mandatoryTowerCard = assetManager.getRandomTowerCards();
    this.cardList.set(mandatoryTowerCard[0].cardId, mandatoryTowerCard[0].prefabId);

    // 나머지 3개의 카드를 랜덤으로 추가
    const cards = assetManager.getRandomCards(3);
    for(let card of cards){
      this.cardList.set(card.cardId, card.prefabId);
    }
    
    const cardDatas = Array.from(this.cardList.entries()).map(([uuid, prefabId]) =>
      create(CardDataSchema, {
        cardId: uuid,
        prefabId: prefabId,
      }),
    );

    const packet = create(B2C_InitCardDataSchema, {
      cardData: cardDatas,
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
   * ---------------------------------------------
   * [addCard]
   * - 카드 랜덤으로 하나 추가
   * ---------------------------------------------
   */
  addRandomCard() {
    if (this.cardList.size >= 7) {
      return;
    }
    const cards = assetManager.towerPrefabIdCaches;
    const turretCards = assetManager.skillPrefabIdCaches;
    const combinedCards = cards.concat(turretCards);
    const randomCard = combinedCards[Math.floor(Math.random() * combinedCards.length)];
    const uuid = uuidv4();
    this.cardList.set(uuid, randomCard.prefabId);

    const packet = create(B2C_AddCardSchema, {
      cardId: uuid,
      prefabId: randomCard.prefabId,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2C_AddCardSchema,
      ePacketId.B2C_AddCard,
      this.session.getNextSequence(),
    );

    this.session.send(sendBuffer);
  }

  /**
   * 카드 사용 실패시 다시 추가
   * @param {string} cardPrefabId 카드 prefabId
   */
  reAddCardOnFailure(cardPrefabId) {
    const card = assetManager.getCardDataByPrefabId(cardPrefabId);
    if (!card) return;

    const uuid = uuidv4();
    this.cardList.set(uuid, card.prefabId);

    const packet = create(B2C_AddCardSchema, {
      cardId: uuid,
      prefabId: card.prefabId,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2C_AddCardSchema,
      ePacketId.B2C_AddCard,
      this.session.getNextSequence(),
    );

    this.session.send(sendBuffer);
  }

  /*
   * 1. 카드 사용시 카드 삭제
   * 2. 타워 일 경우 tower관련 함수를 통해 타워 설치
   * 2-1. 실패시 reAddCardOnFailure를 통해 다시 유저에게 보내기
   * 3. 스킬 카드시 skill관련 함수를 통해 스킬 사용
   * 3-1. 스킬 사용 실패시, reAddCardOnFailure를 통해 카드 다시 추가
   */
  /**
   * ---------------------------------------------
   * [useCard]
   * - 카드 사용
   * ---------------------------------------------
   * @param {string} cardId 카드 ID
   */

  useCard(cardId) {
    const card = this.cardList.get(cardId);
    if (!card) return;
    this.cardList.delete(cardId);
    const responsePacket = create(B2C_UseSkillNotificationSchema, {
      isSuccess: true,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      responsePacket,
      B2C_UseSkillNotificationSchema,
      ePacketId.B2C_SkillResponse,
      this.session.getNextSequence(),
    );

    this.session.send(sendBuffer);
  }
}
