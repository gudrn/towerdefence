import { GameRoom } from './gameRoom';
import { create, fromBinary } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import {
  C2B_PlayerPositionUpdateRequestSchema,
  C2B_PlayerUseAbilityRequestSchema,
} from 'src/protocol/character_pb';
import {
  B2L_CreateGameRoomResponeSchema,
  L2B_CreateGameRoomRequestSchema,
} from 'src/protocol/room_pb';
import { LobbySession } from 'src/main/session/lobbySession';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { BattleSession } from 'src/main/session/battleSession';
import { C2B_TowerBuildRequestSchema } from 'src/protocol/tower_pb';
import { C2B_SkillRequestSchema } from 'src/protocol/skill_pb';
import { GamePlayer } from '../game/gamePlayer';
import { C2B_InitSchema } from 'src/protocol/init_pb';

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
  enterRoomHandler(roomId: number, player: GamePlayer) {
    console.log('enterRoomHandler 호출됨');

    // 1. 유효성 검사: roomId 확인
    const room = this.rooms.get(roomId); // rooms: 서버에서 관리 중인 방 정보
    if (room == undefined) {
      console.log('유효하지 않은 roomId:', roomId);
      return;
    }

    room.enterRoom(player);
  }

  /*---------------------------------------------
   [방 생성]
   ---------------------------------------------*/
  createGameRoomHandler(buffer: Buffer, session: LobbySession) {
    console.log('createGameRoomHandler');
    // 1. 로비 서버 요청 패킷 역직렬화
    const requestPacket = fromBinary(L2B_CreateGameRoomRequestSchema, buffer);

    // 2. 요청 데이터 확인
    const { roomId, maxPlayers } = requestPacket;
    if (!roomId || !maxPlayers) {
      throw new CustomError(ErrorCodes.INVALID_PACKET, '요청 데이터가 올바르지 않습니다.');
    }

    // 3. 방 생성
    const newRoom = new GameRoom(roomId, maxPlayers);

    // 내부 방 관리 시스템에 방 등록
    this.rooms.set(roomId, newRoom);

    console.log(`방 생성 성공: roomId=${roomId}, maxPlayers=${maxPlayers}`);

    // 4. 성공 응답 패킷 생성 및 전송
    const createGameRoomPacket = create(B2L_CreateGameRoomResponeSchema, {
      isCreated: true,
      roomId,
    });

    const createGameRoomBuffer = PacketUtils.SerializePacket(
      createGameRoomPacket,
      B2L_CreateGameRoomResponeSchema,
      ePacketId.B2L_CreateGameRoomRespone,
      session.getNextSequence(),
    );
    session.send(createGameRoomBuffer);
  }

  /**---------------------------------------------
   * [이동 동기화]
   * @param {Buffer} buffer - 이동 데이터 버퍼
   * @param {BattleSession} session - 이동 요청을 보낸 세션
   ---------------------------------------------*/
  moveHandler(buffer: Buffer, session: BattleSession) {
    const packet = fromBinary(C2B_PlayerPositionUpdateRequestSchema, buffer);

    const room = this.rooms.get(packet.roomId);
    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleMove(packet, session);
  }

  /**---------------------------------------------
   * [스킬 사용 동기화]
   * @param {Buffer} buffer - 스킬 사용 패킷 데이터
   * @param {BattleSession} session - 스킬 사용 요청을 보낸 세션
   ---------------------------------------------*/
  skillHandler(buffer: Buffer, session: BattleSession) {
    const payload = fromBinary(C2B_SkillRequestSchema, buffer);
    const room = this.rooms.get(payload.roomId);
    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }
    room.handleSkill(payload, session);
  }

  /**
   * [스킬 사용 동기화]
   * @param {Buffer} buffer - 스킬 사용 패킷 데이터
   * @param {BattleSession} session - 요청을 보낸 세션
   */
  abilityHandler(buffer: Buffer, session: BattleSession) {
    const payload = fromBinary(C2B_PlayerUseAbilityRequestSchema, buffer); // 요청 디코딩
    const room = this.rooms.get(payload.roomId); // 방 찾기

    if (!room) {
      console.error('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleAbility(payload, session); // 어빌리티 처리 요청
  }

  /**---------------------------------------------
   * [타워 생성 동기화]
   * @param {Buffer} buffer - 타워 생성 패킷 데이터
   * @param {BattleSession} session - 타워 생성 요청을 보낸 세션
   ---------------------------------------------*/
  towerBuildHandler(buffer: Buffer, session: BattleSession) {
    // console.log('towerBuildHandler');

    // 1. 패킷 역직렬화
    const packet = fromBinary(C2B_TowerBuildRequestSchema, buffer);

    // 2. 세션에서 roomId 가져오기
    const roomId = packet.roomId;
    const room = this.rooms.get(roomId);

    // console.log('roomId', roomId);

    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleTowerBuild(packet, session);
  }

  onSocketDisconnected(playerId: string) {
    console.log('onSocketDisconnected');
    for (const room of this.rooms.values()) {
      const player = Array.from(room.users.values()).find(
        (user) => user.session.getId() === playerId,
      );
      if (player) {
        room.leaveRoom(player.session.getId());

        if (room.getCurrentUsersCount() <= 0) {
          this.freeRoomId(room.id);
        }
        // if (room.users.size <= 0 ) {
        //   this.freeRoomId(room.id)
        //}
        break;
      }
    }
  }

  freeRoomId(roomId: number) {
    if (!this.rooms.has(roomId)) {
      console.log('유효하지 않은 roomID');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomID');
    }
    const room = this.rooms.get(roomId);
    if (room == null) {
      console.log('유효하지 않은 room');
      return;
    }
    room.destroy();
    this.rooms.delete(roomId);
    this.availableRoomIds.push(roomId);
  }

  getRoom(roomId: number) {
    return this.rooms.get(roomId);
  }
}
export const gameRoomManager = new GameRoomManager();
