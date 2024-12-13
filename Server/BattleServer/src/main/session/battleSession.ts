import { Socket } from "net";
import { Session } from "ServerCore/network/session";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { gameRoomManager } from "src/contents/room/gameRoomManager";
import { sessionManager } from "src/server";
import { handleError } from "src/utils/errorHandler";
import handlerMappings from "../handlerMapping/clientPacketHandler";
import { PacketHeader } from "ServerCore/network/packetHeader";



export class BattleSession extends Session {
  constructor(socket: Socket) {
    super(socket);
  }

  /*---------------------------------------------
   [클라이언트 연결 종료 처리]
  ---------------------------------------------*/
  onEnd() {
    console.log('[BattleSession] 클라이언트 연결이 종료되었습니다.');
    // try {
    //   gameRoomManager.onSocketDisconnected(this.getId()); // 방에서 플레이어를 제거합니다.
    //   sessionManager.removeSession(this.getId());
    // }
    // catch (error) {
    //   console.error('[BattleSession::onEnd] ', error)
    // }
  }


  onError(error: any) {
    console.log(error);
    //[TODO]: 클라 재진입을 위해 바로 제거가 아닌 setTimeout 등을 이용해 제거하기
    // if (error.code === 'ECONNRESET') {
    //   console.log('[BattleSession::onError] 클라이언트 연결이 비정상적으로 종료되었습니다');
    //   try {
    //     gameRoomManager.onSocketDisconnected(this.getId());
    //     sessionManager.removeSession(this.getId());
    //   } catch (err) {
    //     console.error('[BattleSession::onError] 처리 중 에러 발생:', err);
    //   }
    // }
  }
  /**---------------------------------------------
   * [패킷 처리 핸들러]
   ---------------------------------------------*/
  async handlePacket(packet: Buffer, header: PacketHeader) {
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

}
