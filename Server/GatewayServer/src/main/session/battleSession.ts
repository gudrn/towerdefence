import { Socket } from 'net';
import { Session } from 'ServerCore/network/session';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { PacketHeader } from 'ServerCore/network/packetHeader';
import { G2B_InitSchema } from 'src/protocol/init_pb';
import { ePacketId } from 'ServerCore/network/packetId';
import { create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import battleHandlerMappings from '../handlerMapping/battleServerPacketHandler';
import { handleError } from 'src/utils/errorHandler';

export class BattleSession extends Session {
  public host: string = '';
  public port: number = -1;
  public reConnectCount: number = 0;
  public maxReConnectCount: number = 20;

  constructor(socket: Socket) {
    super(socket);
  }

  connect(host: string, port: number) {
    this.socket.connect(port, host, async () => {
      console.log('Connected to server');
      const packet = create(G2B_InitSchema, {
        serverId: this.getId(),
      });

      const sendBuffer = PacketUtils.SerializePacket(packet, G2B_InitSchema, ePacketId.G2B_Init, 0);
      this.send(sendBuffer);
    });
  }

  /*---------------------------------------------
   [클라이언트 연결 종료 처리]
  ---------------------------------------------*/
  onEnd() {
    console.log('[BattleSession] 클라이언트 연결이 종료되었습니다.');

    this.reConnect();
  }

  onError(error: any) {
    switch (error.code) {
      case 'ECONNRESET':
        this.reConnect();
        break;
      case 'ECONNREFUSED':
        this.reConnect();
        break;
      default:
        console.error('소켓 오류:', error);
        handleError(this, new CustomError(500, `소켓 오류: ${error.message}`));
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
      const handler = battleHandlerMappings[header.id];

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

  public init(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  private reConnect() {
    this.reConnectCount += 1;

    if (this.reConnectCount >= this.maxReConnectCount) {
      //console.log("[BattleSession::reConnect] 최대 재연결 횟수 도달");
      this.socket.destroy();
      return;
    }

    setTimeout(() => {
      //console.log('[BattleSession::reConnect] 다시 연결 중');
      this.connect(this.host, this.port);
    }, 5000);
  }
}
