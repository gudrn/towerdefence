import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { GameRoom } from './GameRoom.js';
import { create } from '@bufbuild/protobuf';
import {
  B2L_CreateGameRoomResponeSchema,
  L2B_CreateGameRoomRequestSchema,
} from '../../protocol/room_pb.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { C2B_PositionUpdateRequestSchema } from '../../protocol/character_pb.js';

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
  enterRoomHandler(roomId, player, session) {
    console.log('enterRoomHandler 호출됨');

    // 1. 유효성 검사: roomId 확인
    const room = this.rooms.get(roomId); // rooms: 서버에서 관리 중인 방 정보
    if (!room) {
      console.log('유효하지 않은 roomId:', roomId);
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '해당 roomId를 찾을 수 없습니다.');
    }

    // 2. 방에 플레이어 추가
    const success = room.enterRoom(player); // addPlayer: 방 객체에서 플레이어를 추가하는 메서드
    if (!success) {
      console.log(`플레이어를 방에 추가하지 못했습니다. roomId: ${roomId}, player: ${player.id}`);
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '방 입장에 실패했습니다.');
    }

    // 3. 클라이언트에 전송할 데이터 생성
    const responsePacket = create(B2C_EnterRoomSchema, {
      roomId: roomId,
      playerId: player.id,
      currentPlayers: room.getPlayersInfo(), // 방에 있는 현재 플레이어 정보
      maxPlayerCount: room.maxPlayerCount,
    });

    // 4. 패킷 직렬화
    const sendBuffer = PacketUtils.SerializePacket(
      responsePacket,
      B2C_EnterRoomSchema,
      ePacketId.B2C_Enter,
      session.getNextSequence(),
    );

    // 5. 플레이어 세션을 통해 패킷 전송
    player.session.send(sendBuffer);

    console.log('클라이언트에게 방 입장 정보를 전송했습니다:', {
      roomId,
      playerId: player.id,
      currentPlayers: room.getPlayersInfo(),
    });
  }

  /**---------------------------------------------
   * [방 생성] - 배틀서버에게 게임 방 생성 요청을 보내고, 클라이언트에게 방 ID 전송
   * @param {Buffer} buffer - 방 생성 요청 버퍼
   * @param {LobbySession | BattleSession} session - 요청한 세션
   ---------------------------------------------*/
  createGameRoomHandler(buffer, session) {
    // 1. 클라이언트 요청 패킷 역직렬화
    const requestPacket = fromBinary(L2B_CreateGameRoomRequestSchema, buffer);

    // 2. 요청 데이터 확인
    const { roomId, maxPlayers } = requestPacket;
    if (!roomId || !maxPlayers) {
      throw new CustomError(ErrorCodes.INVALID_PACKET, '요청 데이터가 올바르지 않습니다.');
    }

    // 3. 방 생성
    const gameRoomId = generateUniqueRoomId(); // 고유 Room ID 생성
    const newRoom = new GameRoom(gameRoomId, maxPlayers); // gameRoomId = id, maxPlayers = maxPlayerCount 로 되야하는거 아닌가?

    // 내부 방 관리 시스템에 방 등록
    this.rooms.set(gameRoomId, newRoom);

    console.log(`방 생성 성공: roomId=${roomId}, maxPlayers=${maxPlayers}`);

    // 4. 성공 응답 패킷 생성 및 전송
    const responsePacket = create(B2L_CreateGameRoomResponeSchema, {
      isCreated: true,
      roomId,
    });

    const responseBuffer = PacketUtils.SerializePacket(
      responsePacket,
      B2L_CreateGameRoomResponeSchema,
      ePacketId.B2L_CreateRoom,
      session.getNextSequence(),
    );
    session.send(responseBuffer);
  }

  /**---------------------------------------------
   * [이동 동기화]
   * @param {Buffer} buffer - 이동 데이터 버퍼
   * @param {BattleSession} session - 이동 요청을 보낸 세션
   ---------------------------------------------*/
  moveHandler(buffer, session) {
    console.log('moveHandler 호출됨');

    const packet = fromBinary(C2B_PositionUpdateRequestSchema, buffer);

    const { entityData, roomId } = packet;
    const { pos, uuid } = entityData;

    // 1. 유효한 방 확인
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new CustomError(ErrorCodes.ROOM_NOT_FOUND, '해당 roomId를 찾을 수 없습니다.');
    }

    // 2. 유효한 플레이어 확인
    const player = room.users.find((user) => user.id === uuid);
    if (!player) {
      throw new CustomError(ErrorCodes.USER_NOT_FOUND, '플레이어를 찾을 수 없습니다.');
    }

    room.handleMove(player, pos, session);
  }

  /**---------------------------------------------
   * [타워 생성 동기화]
   * @param {Buffer} buffer - 타워 생성 패킷 데이터
   * @param {BattleSession} session - 타워 생성 요청을 보낸 세션
   ---------------------------------------------*/
  towerBuildHandler(buffer, session) {}

  /**---------------------------------------------
   * [타워 공격 동기화]
   * @param {Buffer} buffer - 타워 공격 패킷 데이터
   * @param {BattleSession} session - 타워 공격 요청을 보낸 세션
   ---------------------------------------------*/
  towerAttackHandler(buffer, session) {}

  /**---------------------------------------------
   * [타워 파괴 동기화]
   * @param {Buffer} buffer - 타워 파괴 패킷 데이터
   * @param {BattleSession} session - 타워 파괴 요청을 보낸 세션
   ---------------------------------------------*/
  towerDestroyHandler(buffer, session) {}

  /**---------------------------------------------
   * [몬스터 생성 동기화]
   * @param {Buffer} buffer - 몬스터 생성 패킷 데이터
   * @param {BattleSession} session - 몬스터 생성 요청을 보낸 세션
   ---------------------------------------------*/
  spawnMonsterHandler(buffer, session) {}

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
  monsterDeathHandler(buffer, session) {}

  /**---------------------------------------------
   * [broadcast] - 모든 유저에게 패킷 전송
   * @param {Buffer} buffer - 전송할 데이터 버퍼
   ---------------------------------------------*/
  broadcast(buffer) {
    for (const user of this.users) {
      user.session.send(buffer);
    }
  }
}

export const gameRoomManager = new GameRoomManager();
