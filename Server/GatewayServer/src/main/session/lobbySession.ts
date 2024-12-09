
import { create } from '@bufbuild/protobuf';
import { Socket } from "net";
import { PacketHeader } from 'ServerCore/network/packetHeader';
import { ePacketId } from "ServerCore/network/packetId";
import { Session } from "ServerCore/network/session";
import { CustomError } from 'ServerCore/utils/error/customError';
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { battleConfig } from "src/config/config";
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { C2L_InitSchema, G2L_InitSchema } from 'src/protocol/init_pb';
import { handleError } from 'src/utils/errorHandler';
import lobbyHandlerMappings from '../handlerMapping/lobbyServerPacketHandler';


/*---------------------------------------------
   [TODO]
   - 모든 session 생성자에 id를 넣어서 생성하기
---------------------------------------------*/
export class LobbySession extends Session {
  constructor(socket: Socket) {
    super(socket);
    //this.setId(serverId);
  }

  /**---------------------------------------------
   * [로비 서버 연결]
   ---------------------------------------------*/
  connect(host: string, port: number) {
    this.socket.connect(port, host, async () => {
      console.log('Connected to server');
      const packet = create(G2L_InitSchema, {
        serverId: this.getId()
      });

      const sendBuffer = PacketUtils.SerializePacket(packet, G2L_InitSchema, ePacketId.B2L_Init, 0);
      this.send(sendBuffer);
    });
  }

  /**---------------------------------------------
   * [소켓 종료 처리]
   ---------------------------------------------*/
  onEnd() {
    console.log('클라이언트 연결이 종료되었습니다.');
  }

  /*---------------------------------------------
    [소켓 에러 처리]
  ---------------------------------------------*/
  onError(error: any) {
    console.error('소켓 오류:', error);
    handleError(this, new CustomError(500, `소켓 오류: ${error.message}`));
    this.socket.destroy();
  }

  /**---------------------------------------------
   * [패킷 처리 핸들러]
   * @param {Buffer} packet - 수신한 패킷
   * @param {PacketHeader} header - 패킷 헤더 정보
   ---------------------------------------------*/
  async handlePacket(packet: Buffer, header: PacketHeader) {
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
