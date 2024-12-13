import { GameRoom } from './gameRoom';
import { create, fromBinary } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { B2G_CreateGameRoomResponseSchema, G2B_CreateGameRoomRequestSchema, G2B_JoinGameRoomRequestSchema } from "src/protocol/room_pb";
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { BattleSession } from 'src/main/session/battleSession';
import { C2B_SkillRequestSchema } from 'src/protocol/skill_pb';
import { GamePlayer } from '../game/gamePlayer';
import { battleConfig } from 'src/config/config';
import { G2B_PlayerPositionUpdateRequestSchema } from 'src/protocol/character_pb';
import { G2B_TowerBuildRequestSchema } from 'src/protocol/tower_pb';


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
    -클라에게 B2C_EnterRoom패킷 전송
---------------------------------------------*/
  enterRoomHandler(buffer: Buffer, session: BattleSession) {
     console.log('enterRoomHandler 호출됨');

    const packet = fromBinary(G2B_JoinGameRoomRequestSchema, buffer);
    // 1. 유효성 검사: roomId 확인
    const room = this.rooms.get(packet.roomId); // rooms: 서버에서 관리 중인 방 정보
    if (room == undefined) {
      console.log('유효하지 않은 roomId:', packet.roomId);
      return;
    }

    if(packet.playerData == undefined) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, "[enterRoomHandler] GamePlayerData가 누락됨");
    }

    const player = new GamePlayer(packet.playerData);
    room.enterRoom(player, session);
  }

  /*---------------------------------------------
   [방 생성]
   ---------------------------------------------*/
  createGameRoomHandler(buffer: Buffer, session: BattleSession) {
    console.log('createGameRoomHandler');
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
      roomId: packet.roomId
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
   [이동 동기화]
  ---------------------------------------------*/
   moveHandler(buffer: Buffer, session: BattleSession) {
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
  towerBuildHandler(buffer:Buffer,session:BattleSession){
    console.log("towerBuildHandler");
    const packet = fromBinary(G2B_TowerBuildRequestSchema,buffer);
    const room = this.rooms.get(packet.roomId);

    if(room == undefined){
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }
    room.handleTowerBuild(packet,session);
  }
}
export const gameRoomManager = new GameRoomManager();
