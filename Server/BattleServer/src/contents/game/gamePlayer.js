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
    this.session = session; // 세션 정보 저장
    this.playerData = playerData; // 플레이어 데이터 저장
    this.gameRoom = gameRoom; // 게임 방 정보 저장
    this.cardList = new Map(); // 카드 목록 초기화
  }

  /**
   * ---------------------------------------------
   * [randomCard]
   * - 카드 랜덤으로 하나 추가
   * ---------------------------------------------
   */
  initCard() {
    const mandatoryTowerCard = assetManager.getRandomTowerCards(); // 필수 포탑 카드 가져오기
    this.cardList.set(mandatoryTowerCard[0].cardId, mandatoryTowerCard[0].prefabId); // 포탑 카드 추가

    const cards = assetManager.getRandomCards(3); // 랜덤 카드 3개 가져오기
    for (let card of cards) {
      this.cardList.set(card.cardId, card.prefabId); // 카드 목록에 추가
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

    this.session.send(sendBuffer); // 초기 카드 데이터 전송
  }

  /**
   * ---------------------------------------------
   * [addCard]
   * - 카드 랜덤으로 하나 추가
   * ---------------------------------------------
   */
  addRandomCard() {
    if (this.cardList.size >= 7) {
      return; // 카드가 7개 이상이면 종료
    }

    const card = assetManager.getRandomCards(); // 랜덤 카드 3개 가져오기
    this.cardList.set(card[0].cardId, card[0].prefabId); // 카드 목록에 추가

    const packet = create(B2C_AddCardSchema, {
      cardData: create(CardDataSchema, {cardId: card[0].cardId, prefabId: card[0].prefabId})
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2C_AddCardSchema,
      ePacketId.B2C_AddCard,
      this.session.getNextSequence(),
    );

    this.session.send(sendBuffer); // 카드 추가 데이터 전송
  }

  /**
   * 카드 사용 실패시 다시 추가
   * @param {string} cardPrefabId 카드 prefabId
   */
  reAddCardOnFailure(cardPrefabId) {
    const card = assetManager.getCardDataByPrefabId(cardPrefabId); // 카드 데이터 가져오기
    if (!card) return;

    const uuid = uuidv4(); // 새로운 UUID 생성
    this.cardList.set(uuid, card.prefabId); // 카드 목록에 추가

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

    this.session.send(sendBuffer); // 카드 추가 데이터 전송
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
    const card = this.cardList.get(cardId); // 카드 목록에서 카드 가져오기
    if (!card) return;
    this.cardList.delete(cardId); // 카드 목록에서 카드 삭제
    const responsePacket = create(B2C_UseSkillNotificationSchema, {
      isSuccess: true,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      responsePacket,
      B2C_UseSkillNotificationSchema,
      ePacketId.B2C_SkillResponse,
      this.session.getNextSequence(),
    );

    this.session.send(sendBuffer); // 카드 사용 결과 전송
  }
}
