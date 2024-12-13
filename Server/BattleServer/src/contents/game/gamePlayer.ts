import { create } from '@bufbuild/protobuf';
import { BattleSession } from 'src/main/session/battleSession';
import { CardData, CardDataSchema, GamePlayerData, SkillDataSchema } from 'src/protocol/struct_pb';
import { assetManager } from 'src/utils/assetManager';
import { createAddRandomCard, createInitCard, createUseCard } from 'src/packet/gamePlayerPacket';
import { Character } from './character/character';
import { GameRoom } from '../room/gameRoom.js';
import { eCharacterId } from 'ServerCore/utils/characterId';
import { CreateCharacter } from './character/createCharcter';

export class GamePlayer {
  public session: BattleSession;
  public playerData: GamePlayerData;
  public cardList: Map<string, string> = new Map();
  public character: Character | null = null; // 플레이어와 연결된 캐릭터


  constructor(session: BattleSession, playerData: GamePlayerData) {
    this.session = session; // 세션 정보 저장
    this.playerData = playerData; // 플레이어 데이터 저장
    this.cardList = new Map(); // 카드 목록 초기화
  }


  /*---------------------------------------------
    [initCard]
---------------------------------------------*/
  initCard() {
    // 포탑 카드를 무조건 하나 추가
    const mandatoryTowerCard: CardData[] = assetManager.getRandomTowerCards();
    this.cardList.set(mandatoryTowerCard[0].cardId, mandatoryTowerCard[0].prefabId);

    const cards = assetManager.getRandomCards(3); // 랜덤 카드 3개 가져오기
    for (let card of cards) {
      this.cardList.set(card.cardId, card.prefabId); // 카드 목록에 추가
    }
    // this.cardList.set('123', 'BuffTower');
    const cardDatas = Array.from(this.cardList.entries()).map(([uuid, prefabId]) =>
      create(CardDataSchema, {
        cardId: uuid,
        prefabId: prefabId,
      }),
    );

    const sendBuffer = createInitCard(cardDatas, this.session.getNextSequence.bind(this));
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

    const card = assetManager.getRandomCards(); // 랜덤 카드 1개 가져오기
    this.cardList.set(card[0].cardId, card[0].prefabId); // 카드 목록에 추가

    const sendBuffer = createAddRandomCard(card, this.session.getNextSequence.bind(this));
    this.session.send(sendBuffer); // 카드 추가 데이터 전송
  }


  //   /**
  //    * 카드 사용 실패시 다시 추가
  //    * @param {string} cardPrefabId 카드 prefabId
  //    */
  //   reAddCardOnFailure(cardPrefabId) {
  //     const card = assetManager.getCardDataByPrefabId(cardPrefabId); // 카드 데이터 가져오기
  //     if (!card) return;

  //     const uuid = uuidv4(); // 새로운 UUID 생성
  //     this.cardList.set(uuid, card.prefabId); // 카드 목록에 추가

  //     const packet = create(B2C_AddCardSchema, {
  //       cardId: uuid,
  //       prefabId: card.prefabId,
  //     });

  //     const sendBuffer = PacketUtils.SerializePacket(
  //       packet,
  //       B2C_AddCardSchema,
  //       ePacketId.B2C_AddCard,
  //       this.session.getNextSequence(),
  //     );

  //     this.session.send(sendBuffer); // 카드 추가 데이터 전송
  //   }

  /*
   * 1. 카드 사용시 카드 삭제
   * 2. 타워 일 경우 tower관련 함수를 통해 타워 설치
   * 2-1. 실패시 reAddCardOnFailure를 통해 다시 유저에게 보내기
   * 3. 스킬 카드시 skill관련 함수를 통해 스킬 사용
   * 3-1. 스킬 사용 실패시, reAddCardOnFailure를 통해 카드 다시 추가
   */
  /*---------------------------------------------
   [useCard]
   ---------------------------------------------*/

  useCard(cardId: string) {
    const card = this.cardList.get(cardId); // 카드 목록에서 카드 가져오기
    if (!card) return;
    this.cardList.delete(cardId); // 카드 목록에서 카드 삭제

    const sendBuffer = createUseCard(
      this.session.getId(),
      card,
      this.session.getNextSequence.bind(this),
    );

    this.session.send(sendBuffer); // 카드 사용 결과 전송
  }

  public getCardList() {
    return this.cardList;
  }

  public useAbility(payload: any, session: BattleSession) {
    this.character?.useAbility(payload, session);
    return;
  }
}
