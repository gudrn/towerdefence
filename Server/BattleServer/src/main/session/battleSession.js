import { Socket } from 'net';
import { Session } from 'ServerCore/src/network/session.js';
import { handleError } from '../../utils/errorHandler.js';
import handlerMappings from '../handlerMapping/clientPacketHandler.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { gameRoomManager } from '../../contents/room/gameRoomManager.js';
import { sessionManager } from '../../server.js';
import { B2L_SocketDisconnectedNotificationSchema } from '../../protocol/room_pb.js';
import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { PacketUtils } from "ServerCore/src/utils/packetUtils.js";
import { create } from '@bufbuild/protobuf';
import { lobbySession } from '../../server.js';


export class BattleSession extends Session {
  constructor(socket) {
    super(socket);
    this.nickname = 'tmpName';
  }

  /*---------------------------------------------
   [클라이언트 연결 종료 처리]
  ---------------------------------------------*/
  onEnd() {
      console.log('[BattleSession] 클라이언트 연결이 종료되었습니다.');
      try{
      gameRoomManager.onSocketDisconnected(this.getId()); // 방에서 플레이어를 제거합니다.
      sessionManager.removeSession(this.getId());
    } 
    catch (error) {
      console.error('[BattleSession::onEnd] ', error)
    }
  }

  /**---------------------------------------------
   * [소켓 에러 처리]
   * @param {Error} error
   */
  onError(error) {
    console.log(error);
    //[TODO]: 클라 재진입을 위해 바로 제거가 아닌 setTimeout 등을 이용해 제거하기
    if (error.code === 'ECONNRESET') {
      console.log('[BattleSession::onError] 클라이언트 연결이 비정상적으로 종료되었습니다');
      try {
          gameRoomManager.onSocketDisconnected(this.getId());
          sessionManager.removeSession(this.getId());
      } catch (err) {
          console.error('[BattleSession::onError] 처리 중 에러 발생:', err);
      }
  }
  /**---------------------------------------------
   * [패킷 처리 핸들러]
   * @param {Buffer} packet
   * @param {PacketHeader} header
   ---------------------------------------------*/
  async handlePacket(packet, header) {
    try {
      // 1. sequence 검증
      if (this.sequence !== header.sequence) {
        // 시퀀스 검증 로직
      }

      // 2. 패킷 ID에 해당하는 핸들러 확인
      const handler = handlerMappings[header.id];

      // 2-1. 핸들러가 존재하지 않을 경우 오류 출력
      if (!handler) {
        throw new CustomError(
          ErrorCodes.INVALID_PACKET_ID,
          `패킷id가 잘못되었습니다: ${header.id}`,
        );
      }

      // 3. 핸들러 호출
      await handler(packet, this);
    } catch (error) {
      console.log('핸들 에러 호출');
      console.log(error);
      handleError(this, error);
    }
  }

  /**---------------------------------------------
   * @returns {string} nickname
   ---------------------------------------------*/
  getNickname() {
    return this.nickname;
  }

  /**---------------------------------------------
   * @param {string} nickname
   ---------------------------------------------*/
  setNickname(nickname) {
    this.nickname = nickname;
  }
}
