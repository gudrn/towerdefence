import { Session } from "ServerCore/network/session";
import { CustomError } from "ServerCore/utils/error/customError";
import { lobbySessionManager } from "src/server";
import { handleError } from "src/utils/errorHandler";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import handlerMappings from "../handlerMapping/clientPacketHandler";
import { onSocketDisconnected } from "../handler/roomHandler";
import { PacketHeader } from "ServerCore/network/packetHeader";

export class LobbySession extends Session {
  nickname: string;
  prefabId: string;
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
  protected onEnd() {
    console.log('[LobbySession] 클라이언트 연결이 종료되었습니다.');
    onSocketDisconnected(this.getId());
  }
  

  /*---------------------------------------------
    [onError]
    - 발생 조건: 에러가 발생했을 때
    - 목적: 예외 상황을 적절히 처리하고 로그를 남기거나 대응을 하기
    
    - 이 이벤트 이후 곧바로 close이벤트 호출
  ---------------------------------------------*/
  protected onError(error: any) {
    console.error('소켓 오류:', error);
    onSocketDisconnected(this.getId());
    handleError(this, new CustomError(500, `소켓 오류: ${error.message}`));
  }

  /*---------------------------------------------
    [handlePacket]
    - 목적: 수신한 패킷의 Id에 맞는 함수 호출

    1. sequence 검증
    2. 패킷 ID에 해당하는 핸들러 확인
      2-1. 핸들러가 존재하지 않을 경우 오류 출력
    3. 핸들러 호출
  ---------------------------------------------*/
  protected async handlePacket(packet: Buffer, header: PacketHeader): Promise<void> {
    //console.log('핸들러 호출');
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
  setNickname(nickname: string) {
    this.nickname = nickname;
  }
  /*---------------------------------------------
    [getter]
  ---------------------------------------------*/
  getPrefabId() {
    return this.prefabId;
  }
}
