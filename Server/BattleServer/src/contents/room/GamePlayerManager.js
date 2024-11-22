import { fromBinary, create } from '@bufbuild/protobuf';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { C2B_PositionUpdateRequestSchema } from 'src/protocol/character_pb';
import { C2B_PlayerStateUpdateRequestSchema } from 'src/protocol/player_pb.js';

class GamePlayerManager {
  constructor() {
    /** @private @type {Map<string, GamePlayer>} */
    this.players = new Map();
    /** @private @type {GameRoom} */
    this.room = null;
  }

  /**
   * 룸 설정
   * @param {GameRoom} room 
   */
  setRoom(room) {
    this.room = room;
  }

  /**
   * 플레이어 추가
   * @param {GamePlayer} player 
   */
  addPlayer(player) {
    player.room = this.room;
    this.players.set(player.id, player);
  }

  /**---------------------------------------------
   * [플레이어 상태 동기화]
   * @param {Buffer} buffer - 상태 변경 패킷 데이터
   * @param {BattleSession} session - 상태 변경 요청을 보낸 세션
   ---------------------------------------------*/
  updateStateHandler(buffer, session) {
    console.log('updateStateHandler');

    const requestPacket = fromBinary(C2B_PlayerStateUpdateRequestSchema, buffer);
    const { playerId, newState } = requestPacket;

    // 유효한 플레이어 확인
    const player = this.players.get(playerId);
    if (!player) {
      throw new CustomError(ErrorCodes.USER_NOT_FOUND, '플레이어를 찾을 수 없습니다.');
    }

    player.updateState(newState);
  }



  /**---------------------------------------------
   * 플레이어 위치 동기화
   * @param {Buffer} buffer - 위치 변경 패킷 데이터
   * @param {BattleSession} session - 위치 변경 요청을 보낸 세션
   ---------------------------------------------*/
  updatePositionHandler(buffer, session) {
    console.log('updatePositionHandler');
    const packet = fromBinary(C2B_PositionUpdateRequestSchema, buffer);
    const { entityData } = packet;

    // 유효한 플레이어 확인
    const player = this.players.get(entityData.uuid);
    if (!player) {
      throw new CustomError(ErrorCodes.USER_NOT_FOUND, '플레이어를 찾을 수 없습니다.');
    }

    // 새로운 위치 정보
    const newPosition = {
      x: entityData.pos.x,
      y: entityData.pos.y,
    };

    player.updatePosition(newPosition);
  }

  /**---------------------------------------------
   * 플레이어 이동 속도 설정
   * @param {number} speed - 새로운 이동 속도
   ---------------------------------------------*/
  MoveSpeedHandler(speed) {}

  /**---------------------------------------------
   * [카드 사용 동기화]
   * @param {Buffer} buffer - 카드 사용 패킷 데이터
   * @param {BattleSession} session - 카드 사용 요청을 보낸 세션
   ---------------------------------------------*/
  useCardHandler(buffer, session) {}
}

export const gamePlayerManager = new GamePlayerManager();
