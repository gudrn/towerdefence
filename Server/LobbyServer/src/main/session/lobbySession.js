import { Session } from 'ServerCore/src/network/session.js';
import handlerMappings from '../handlerMapping/clientPacketHandler.js';
import { lobbySessionManager } from '../../server.js';
import { handleError } from '../../utils/errorHandler.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';
import { roomManager } from '../../contents/room/roomManager.js'; // 방 관리자를 임포트합니다.

export class LobbySession extends Session {
  constructor(socket) {
    super(socket);
    this.nickname = 'tmpName';
    this.prefabId = "Red";
  }

  /*---------------------------------------------
    [onEnd]
    - 발생 조건: 상대방이 FIN패킷을 보냈을 때 
    - 목적: 자원을 정리하거나 로그를 남기기
  ---------------------------------------------*/
  onEnd() {
    console.log('클라이언트 연결이 종료되었습니다.');
    roomManager.onSocketDisconnected(this.getId()); // 방에서 플레이어를 제거합니다.
    lobbySessionManager.removeSession(this.getId());
  }

  /*---------------------------------------------
    [onError]
    - 발생 조건: 에러가 발생했을 때
    - 목적: 예외 상황을 적절히 처리하고 로그를 남기거나 대응을 하기
    
    - 이 이벤트 이후 곧바로 close이벤트 호출
  ---------------------------------------------*/
  onError(error) {
    console.error('소켓 오류:', error);
    handleError(this, new CustomError(500, `소켓 오류: ${error.message}`));
    // 세션에서 유저 삭제
    roomManager.onSocketDisconnected(this.getId()); // 방에서 플레이어를 제거합니다.
    console.log('유저 제거: ', lobbySessionManager.removeSession(this.getId()));
  }

  /*---------------------------------------------
    [handlePacket]
    - 목적: 수신한 패킷의 Id에 맞는 함수 호출

    1. sequence 검증
    2. 패킷 ID에 해당하는 핸들러 확인
      2-1. 핸들러가 존재하지 않을 경우 오류 출력
    3. 핸들러 호출
  ---------------------------------------------*/
  async handlePacket(packet, header) {
    console.log('핸들러 호출');
    try {
      // 1. sequence 검증
      if (this.sequence !== header.sequence) {
        // 시퀀스 오류를 체크할 수 있습니다.
        // throw new CustomError(
        //   ErrorCodes.INVALID_SEQUENCE,
        //   "시퀀스가 잘못되었습니다."
        // );
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
      handleError(this, error);
    }
  }

  /*---------------------------------------------
    [getter]
  ---------------------------------------------*/
  getNickname() {
    return this.nickname;
  }

  /*---------------------------------------------
    [setter]
  ---------------------------------------------*/
  setNickname(nickname) {
    this.nickname = nickname;
  }
  /*---------------------------------------------
    [getter]
  ---------------------------------------------*/
  getPrefabId() {
    return this.prefabId;
  }
}
