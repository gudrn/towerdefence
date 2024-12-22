import { Socket } from "net";
import { Session } from "ServerCore/network/session";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketHeader } from "ServerCore/network/packetHeader";
import gatewayHandlerMappings from "../handlerMapping/gatewayServerPacketHandler";
import { gatewaySessionManager, lobbySessionManager } from "src/server";
import { G2L_LeaveRoomRequestSchema } from "src/protocol/room_pb";
import { create } from "@bufbuild/protobuf";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { handleError } from "src/utils/errorHandler";
import { roomManager } from "src/contents/roomManager";

export class GatewaySession extends Session { 
  public isReady: boolean = false;
  public currentRoomId: number = -1;

  constructor(socket: Socket) {
    super(socket);
  }

  /*---------------------------------------------
   [클라이언트 연결 종료 처리]
   //1. 세션 매니저에서 제거하기
   //2. 방에 참가했다면, redis에서 제거하기
  ---------------------------------------------*/
  onEnd() {
    console.log('[GatewaySession] 클라이언트 연결이 종료되었습니다.');
    this.onDisconnect();
  }


  onError(error: any) {
    console.log(error);
    switch (error.code) {
      case 'ECONNRESET':
        this.onDisconnect();
        break;
      default:
        console.error('소켓 오류:', error);
        break;
    }
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
      const handler = gatewayHandlerMappings[header.id];

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
      //handleError(this, error);
    }
  }

  private onDisconnect() {
    roomManager.leaveRoom(this.currentRoomId, this.id);
    gatewaySessionManager.removeSession(this.id);
    if(this.currentRoomId != -1){
      const lobbySession = lobbySessionManager.getRandomSession();
      if(lobbySession == undefined){
        return;
      }

      const packet = create(G2L_LeaveRoomRequestSchema, {
        roomId: this.currentRoomId,
        userId: this.id
      });

      const sendBuffer= PacketUtils.SerializePacket(packet, G2L_LeaveRoomRequestSchema, ePacketId.G2L_LeaveRoomRequest, 0);
      lobbySession.send(sendBuffer);
    }
  }
}
