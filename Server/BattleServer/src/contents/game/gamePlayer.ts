import { gatewayConfig } from './../../../../GatewayServer/src/config/config';

import { v4 as uuidv4 } from 'uuid';
import { create } from '@bufbuild/protobuf';
import { BattleSession } from 'src/main/session/battleSession';
import { CardData, CardDataSchema, GamePlayerData, SkillDataSchema } from 'src/protocol/struct_pb';
import { GameRoom } from '../room/gameRoom';
import { assetManager } from 'src/utils/assetManager';
import {
  B2G_AddCardSchema,
  B2G_InitCardDataSchema,
  B2G_UseSkillNotificationSchema,
} from 'src/protocol/skill_pb';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { sessionManager } from 'src/server';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { G2B_PlayerUseAbilityRequest } from 'src/protocol/character_pb';
import { Character } from './character/character';
import { gameRoomManager } from '../room/gameRoomManager';
import { CreateCharacter } from './character/createCharcter';

export class GamePlayer {
  public playerData: GamePlayerData;
  public cardList: Map<string, string> = new Map();
  private isInitCard: Boolean = false;
  public character: Character | null = null; // 플레이어와 연결된 캐릭터

  constructor(playerData: GamePlayerData, roomId: number) {
    this.playerData = playerData; // 플레이어 데이터 저장
    this.cardList = new Map(); // 카드 목록 초기화

    const room = gameRoomManager.getRoom(roomId);
    if (room == undefined) {
      throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, `유효하지 않은 roomID ${roomId}`);
    }
    this.character = CreateCharacter.createChar(playerData.prefabId, room, this);
    this.playerData.coolDown = this.character.cooldown;
  }

  /*---------------------------------------------
    [initCard]
---------------------------------------------*/
  initCard() {
    if (this.isInitCard) return;
    this.isInitCard = true;


    // 포탑 카드를 무조건 하나 추가
    const mandatoryTowerCard: CardData[] = assetManager.getRandomTowerCards();
    this.cardList.set(mandatoryTowerCard[0].cardId, mandatoryTowerCard[0].prefabId);

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

    const packet = create(B2G_InitCardDataSchema, {
      cardData: cardDatas,
      userId: this.playerData.position?.uuid,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2G_InitCardDataSchema,
      ePacketId.B2G_InitCardData,
      0,
    );

    const gatewaySession = sessionManager.getRandomSession();
    if (gatewaySession == null) {
      throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, '게이트웨이 세션을 찾지 못했습니다.');
    }

    gatewaySession.send(sendBuffer); // 초기 카드 데이터 전송
  }

  /*---------------------------------------------
   [addCard]
     - 카드 랜덤으로 하나 추가
  ---------------------------------------------*/
  public addRandomCard() {
    if (this.cardList.size >= 7) {
      return; // 카드가 7개 이상이면 종료
    }

    const card = assetManager.getRandomCards(); // 랜덤 카드 1개 가져오기
    this.cardList.set(card[0].cardId, card[0].prefabId); // 카드 목록에 추가

    const packet = create(B2G_AddCardSchema, {
      roomId:this.character?.room.id,
      userId:this.playerData.position?.uuid,
      cardData: create(CardDataSchema, { cardId: card[0].cardId, prefabId: card[0].prefabId }),
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2G_AddCardSchema,
      ePacketId.B2G_AddCard,
      0,
    );

    const gatewaySession = sessionManager.getRandomSession();
    if (gatewaySession == null) {
      throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, '게이트웨이 세션을 찾지 못했습니다.');
    }

    gatewaySession.send(sendBuffer); // 카드 추가 데이터 전송
  }

  /*---------------------------------------------
   [useCard]
   ---------------------------------------------*/

  useCard(cardId: string) {
    const card = this.cardList.get(cardId); // 카드 목록에서 카드 가져오기
    if (!card) return;
    this.cardList.delete(cardId); // 카드 목록에서 카드 삭제
  }

  public getCardList() {
    return this.cardList;
  }

  public useAbility() {
    if (this.character == null) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, ' 데이터가 없음.');
    }
    this.character.useAbility();
  }
}
