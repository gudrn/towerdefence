import { GameRoom } from './gameRoom';
import { create, fromBinary } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import {
  B2G_CreateGameRoomResponseSchema,
  B2G_DeleteGameRoomRequestSchema,
  G2B_CreateGameRoomRequestSchema,
  G2B_JoinGameRoomRequestSchema,
} from 'src/protocol/room_pb';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { BattleSession } from 'src/main/session/battleSession';
import { GamePlayer } from '../game/gamePlayer';
import { G2B_PlayerPositionUpdateRequestSchema, G2B_PlayerUseAbilityRequestSchema } from 'src/protocol/character_pb';
import { G2B_TowerBuildRequestSchema } from 'src/protocol/tower_pb';
import { G2B_UseSkillRequest, G2B_UseSkillRequestSchema } from 'src/protocol/skill_pb';
import { sessionManager } from 'src/server';

const MAX_ROOMS_SIZE = 10000;

class GameRoomManager {
  /*---------------------------------------------
  [멤버 변수]
---------------------------------------------*/
  private rooms = new Map<number, GameRoom>();
  private availableRoomIds = Array.from({ length: MAX_ROOMS_SIZE }, (_, i) => i + 1);

  constructor() {}

  /*---------------------------------------------
    [방 입장]
---------------------------------------------*/
  public enterRoomHandler(buffer: Buffer, session: BattleSession) {
    console.log('enterRoomHandler 호출됨');

    const packet = fromBinary(G2B_JoinGameRoomRequestSchema, buffer);
    // 1. 유효성 검사: roomId 확인
    const room = this.rooms.get(packet.roomId); // rooms: 서버에서 관리 중인 방 정보
    if (room == undefined) {
      console.log('유효하지 않은 roomId:', packet.roomId);
      return;
    }

    if (packet.playerData == undefined) {
      throw new CustomError(
        ErrorCodes.MISSING_FIELDS,
        '[enterRoomHandler] GamePlayerData가 누락됨',
      );
    }

    const player = new GamePlayer(packet.playerData, packet.roomId);
    room.enterRoom(player, session);
  }

  /*---------------------------------------------
   [방 생성]
   ---------------------------------------------*/
  public createGameRoomHandler(buffer: Buffer, session: BattleSession) {
    // 1. 로비 서버 요청 패킷 역직렬화
    const packet = fromBinary(G2B_CreateGameRoomRequestSchema, buffer);

    // 2. 요청 데이터 확인
    if (!packet.roomId || !packet.maxUserNum) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, '요청 데이터가 올바르지 않습니다.');
    }

    // 3. 방 생성
    const newRoom = new GameRoom(packet.roomId, packet.maxUserNum);

    // 내부 방 관리 시스템에 방 등록
    this.rooms.set(packet.roomId, newRoom);

    console.log(`방 생성 성공: roomId=${packet.roomId}, maxPlayers=${packet.maxUserNum}`);

    // 4. 성공 응답 패킷 생성 및 전송
    const createGameRoomPacket = create(B2G_CreateGameRoomResponseSchema, {
      roomId: packet.roomId,
    });

    const createGameRoomBuffer = PacketUtils.SerializePacket(
      createGameRoomPacket,
      B2G_CreateGameRoomResponseSchema,
      ePacketId.B2G_CreateGameRoomResponse,
      session.getNextSequence(),
    );
    session.send(createGameRoomBuffer);
  }

    /*---------------------------------------------
   [방 제거]
   ---------------------------------------------*/
   public deleteGameRoom(roomId:number) {

    if(!roomId) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, 'roomId가 없습니다.');
    }

    this.rooms.delete(roomId);
    console.log(`${roomId}방 제거에 성공했습니다.`)

    const deleteGameRoomPacket = create(B2G_DeleteGameRoomRequestSchema, {
      roomId: roomId,
    })
    
    const deleteGameRoomBuffer = PacketUtils.SerializePacket(
      deleteGameRoomPacket,
      B2G_DeleteGameRoomRequestSchema,
      ePacketId.B2G_DeleteGameRoomRequest,
      0
    );

    const gatewaySession = sessionManager.getRandomSession();
    if(gatewaySession != undefined){
      gatewaySession.send(deleteGameRoomBuffer)
    }
   }

  /*---------------------------------------------
   [이동 동기화]
  ---------------------------------------------*/
  public moveHandler(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(G2B_PlayerPositionUpdateRequestSchema, buffer);

    const room = this.rooms.get(packet.roomId);
    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleMove(packet, session);
  }
  /*---------------------------------------------
   [타워 설치]
  ---------------------------------------------*/
  public towerBuildHandler(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(G2B_TowerBuildRequestSchema, buffer);
    const room = this.rooms.get(packet.roomId);

    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }
    room.handleTowerBuild(packet, session);
  }

  /*---------------------------------------------
   [스킬 카드 사용 동기화]
  ---------------------------------------------*/
  public skillHandler(buffer: Buffer, session: BattleSession) {
    const packet: G2B_UseSkillRequest = fromBinary(G2B_UseSkillRequestSchema, buffer);
    const room = this.rooms.get(packet.roomId);
    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }
    room.handleSkill(packet, session);
  }

  /*---------------------------------------------
   [캐릭터 고유 능력 사용 동기화]
  ---------------------------------------------*/
  abilityHandler(buffer: Buffer, session: BattleSession) {
    const payload = fromBinary(G2B_PlayerUseAbilityRequestSchema, buffer); // 요청 디코딩
    const room: GameRoom | undefined = this.rooms.get(payload.roomId); // 방 찾기

    if (!room) {
      console.error('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleAbility(payload, session); // 어빌리티 처리 요청
  }

  public getRoom(roomId: number) {
    return this.rooms.get(roomId);
  }
}
export const gameRoomManager = new GameRoomManager();
