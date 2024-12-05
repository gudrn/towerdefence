import { Session } from 'ServerCore/src/network/session.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { battleConfig } from '../../config/config.js';
import { create } from '@bufbuild/protobuf';
import { handleError } from '../../utils/errorHandler.js';
import { CustomError } from 'ServerCore/src/utils/error/customError.js';
import { ePacketId } from 'ServerCore/src/network/packetId.js';
import lobbyHandlerMappings from '../handlerMapping/lobbyServerPacketHandler.js';
import { B2L_InitSchema } from '../../protocol/init_pb.js';
import { ErrorCodes } from 'ServerCore/src/utils/error/errorCodes.js';

export class LobbySession extends Session {
  constructor(socket) {
    super(socket);
    this.setId('battleServerSession');
  }

  /**---------------------------------------------
   * [로비 서버 연결]
   ---------------------------------------------*/
  connectLobbyServer() {
    this.socket.connect(battleConfig.lobbyServer.port, battleConfig.lobbyServer.host, async () => {
      console.log('Connected to server');
      const packet = create(B2L_InitSchema, {
        serverId: this.getId(),
      });

      const sendBuffer = PacketUtils.SerializePacket(packet, B2L_InitSchema, ePacketId.B2L_Init, 0);
      this.send(sendBuffer);
    });
  }

  /**---------------------------------------------
   * [소켓 종료 처리]
   ---------------------------------------------*/
  onEnd() {
    console.log('클라이언트 연결이 종료되었습니다.');
    gameRoomManager.onSocketDisconnected(this.getId()); // 방에서 플레이어를 제거합니다.
    sessionManager.removeSession(this.getId());
  }

  /**---------------------------------------------
     * [소켓 에러 처리]
     * @param {Error} error - 발생한 에러
     ---------------------------------------------*/
  onError(error) {
    console.error('소켓 오류:', error);
    handleError(this, new CustomError(500, `소켓 오류: ${error.message}`));
    this.socket.destroy();
  }

  /**---------------------------------------------
   * [패킷 처리 핸들러]
   * @param {Buffer} packet - 수신한 패킷
   * @param {PacketHeader} header - 패킷 헤더 정보
   ---------------------------------------------*/
  async handlePacket(packet, header) {
    console.log('핸들러 호출', header.id);
    try {
      // 1. sequence 검증
      if (this.sequence !== header.sequence) {
        // 시퀀스 검증 로직
      }

      // 2. 패킷 ID에 해당하는 핸들러 확인
      const handler = lobbyHandlerMappings[header.id];

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
      console.log("로비 세션에서 발생 ㅇㅇ")
      handleError(this, error);
    }
  }
}
