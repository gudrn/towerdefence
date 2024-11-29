import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { GameRoom } from './GameRoom.js';
import { fromBinary, create } from '@bufbuild/protobuf';
import {
  B2L_CreateGameRoomResponeSchema,
  L2B_CreateGameRoomRequestSchema,
} from '../../protocol/room_pb.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { BattleSession } from '../../main/session/battleSession.js';
import {
  B2C_MonsterDeathNotificationSchema,
  C2B_MonsterDeathRequestSchema,
} from '../../protocol/monster_pb.js';
import { C2B_PositionUpdateRequestSchema } from '../../protocol/character_pb.js';
import {
  B2C_TowerAttackRequestSchema,
  C2B_TowerBuildRequestSchema,
  C2B_TowerDestroyRequestSchema,
} from '../../protocol/tower_pb.js';

const MAX_ROOMS_SIZE = 10000;

class GameRoomManager {
  constructor() {
    /** @private @type {Map<string, GameRoom>} */
    this.rooms = new Map();
    this.availableRoomIds = Array.from({ length: MAX_ROOMS_SIZE }, (_, i) => i + 1);
  }

  /**---------------------------------------------
   * [방 입장] - 클라이언트에게 B2C_EnterRoom 패킷 전송
   * @param {number} roomId - 입장할 방 ID
   * @param {GamePlayer} player - 입장할 플레이어 정보
   * @param {BattleSession} session
   ---------------------------------------------*/
  enterRoomHandler(roomId, player) {
    console.log('enterRoomHandler 호출됨');

    // 1. 유효성 검사: roomId 확인
    const room = this.rooms.get(roomId); // rooms: 서버에서 관리 중인 방 정보
    if (room == undefined) {
      console.log('유효하지 않은 roomId:', roomId);
      return;
    }

    room.enterRoom(player);
  }

  /**---------------------------------------------
   * [방 생성] - 배틀서버에게 게임 방 생성 요청을 보내고, 클라이언트에게 방 ID 전송
   * @param {Buffer} buffer - 방 생성 요청 버퍼
   * @param {LobbySession} session - 요청한 세션
   ---------------------------------------------*/
  createGameRoomHandler(buffer, session) {
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
  moveHandler(buffer, session) {
    const packet = fromBinary(C2B_PositionUpdateRequestSchema, buffer);

    const room = this.rooms.get(packet.roomId);
    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleMove(packet, session);
  }

  /**---------------------------------------------
   * [카드 사용 동기화]
   * @param {Buffer} buffer - 카드 사용 패킷 데이터
   * @param {BattleSession} session - 카드 사용 요청을 보낸 세션
   ---------------------------------------------*/
  useCardHandler(buffer, session) {}

  /**---------------------------------------------
   * [스킬 사용 동기화]
   * @param {Buffer} buffer - 스킬 사용 패킷 데이터
   * @param {BattleSession} session - 스킬 사용 요청을 보낸 세션
   ---------------------------------------------*/
  skillHandler(buffer, session) {}

  /**---------------------------------------------
   * [타워 생성 동기화]
   * @param {Buffer} buffer - 타워 생성 패킷 데이터
   * @param {BattleSession} session - 타워 생성 요청을 보낸 세션
   ---------------------------------------------*/
  towerBuildHandler(buffer, session) {
    console.log('towerBuildHandler');

    // 1. 패킷 역직렬화
    const packet = fromBinary(C2B_TowerBuildRequestSchema, buffer);

    // 2. 세션에서 roomId 가져오기
    const roomId = packet.roomId;
    const room = this.rooms.get(roomId);

    console.log('roomId', roomId);

    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleTowerBuild(packet, session);
  }

  /**---------------------------------------------
   * [타워 공격 동기화]
   * @param {Buffer} buffer - 타워 공격 패킷 데이터
   * @param {BattleSession} session - 타워 공격 요청을 보낸 세션
   ---------------------------------------------*/
  towerAttackHandler(buffer, session) {
    console.log('towerAttackHandler');

    // 1. 패킷 역직렬화
    const packet = fromBinary(B2C_TowerAttackRequestSchema, buffer);

    // 2. 세션에서 roomId 가져오기
    const roomId = session.roomId;
    const room = this.rooms.get(roomId);

    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleTowerAttack(packet, session);
  }

  /**---------------------------------------------
   * [타워 파괴 동기화]
   * @param {Buffer} buffer - 타워 파괴 패킷 데이터
   * @param {BattleSession} session - 타워 파괴 요청을 보낸 세션
   ---------------------------------------------*/
  towerDestroyHandler(buffer, session) {
    console.log('towerDestroyHandler');

    // 1. 패킷 역직렬화
    const packet = fromBinary(C2B_TowerDestroyRequestSchema, buffer);

    // 2. 세션에서 roomId 가져오기
    const roomId = session.roomId;
    const room = this.rooms.get(roomId);

    if (room == undefined) {
      console.log('유효하지 않은 roomId');
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '유효하지 않은 roomId');
    }

    room.handleTowerDestroy(packet, session);
  }

  /**---------------------------------------------
   * [몬스터 타워 공격 동기화]
   * @param {Buffer} buffer - 몬스터 타워 공격 패킷 데이터
   * @param {BattleSession} session - 몬스터 타워 공격 요청을 보낸 세션
   ---------------------------------------------*/
  monsterAttackTowerHandler(buffer, session) {}

  /**---------------------------------------------
   * [타워 HP 동기화]
   * @param {Buffer} buffer - 타워 HP 패킷 데이터
   * @param {BattleSession} session - 타워 HP 요청을 보낸 세션
   ---------------------------------------------*/
  updateTowerHPHandler(buffer, session) {}

  /**---------------------------------------------
   * [몬스터 기지 공격 동기화]
   * @param {Buffer} buffer - 몬스터 기지 공격 패킷 데이터
   * @param {BattleSession} session - 몬스터 기지 공격 요청을 보낸 세션
   ---------------------------------------------*/
  monsterAttackBaseHandler(buffer, session) {}

  /**---------------------------------------------
   * [몬스터 사망 동기화]
   * @param {Buffer} buffer - 몬스터 사망 패킷 데이터
   * @param {BattleSession} session - 몬스터 사망 요청을 보낸 세션
   ---------------------------------------------*/
  monsterDeathHandler(buffer, session) {
    fromBinary(C2B_MonsterDeathRequestSchema, buffer);
    const { monsterId } = buffer;

    session.removeMonster(monsterId);

    // 3. 클라이언트에 전송할 데이터 생성
    const notificationPacket = create(B2C_MonsterDeathNotificationSchema, {
      monsterId: monsterId,
    });

    // 4. 패킷 직렬화
    const notificationBuffer = PacketUtils.SerializePacket(
      notificationPacket,
      B2C_MonsterDeathNotificationSchema,
      ePacketId.B2C_MonsterDeathNotification,
      session.getNextSequence(),
    );
    this.broadcast(notificationBuffer);
  }
}
export const gameRoomManager = new GameRoomManager();
