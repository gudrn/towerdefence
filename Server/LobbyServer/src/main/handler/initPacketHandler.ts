import { create, fromBinary } from "@bufbuild/protobuf";
import { config } from "ServerCore/config/config";
import { ePacketId } from "ServerCore/network/packetId";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { B2L_InitSchema, C2L_InitSchema, G2L_Init, G2L_InitSchema, L2C_InitSchema } from "src/protocol/init_pb";
import { lobbySessionManager } from "../../server";
import { Socket } from "net";
import { PacketHeader } from "ServerCore/network/packetHeader";



export const onConnection = (socket: Socket): void => {
  console.log('새로운 연결이 감지되었습니다:', socket.remoteAddress, socket.remotePort);

  let buffer = Buffer.alloc(0);

  socket.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);

    if (buffer.length < config.packet.sizeOfHeader) {
      return;
    }

    let header: PacketHeader = PacketUtils.readPacketHeader(buffer);
    if (buffer.length < header.size) {
      console.log('파싱X', buffer.length, header.size);
      return;
    }

    const packet = buffer.subarray(config.packet.sizeOfHeader, header.size);

    switch (header.id) {
      case ePacketId.G2L_Init:
        console.log('게이트웨이 서버 접속');
        initialHandler(packet, socket, ePacketId.G2L_Init);
        break;
      default:
        console.log('비정상적인 접속');
        socket.destroy();
        break;
    }
  });
};

/*---------------------------------------------
    [초기화 핸들러] 
    [TODO] Initial패킷 구조 변경에 따른 코드 변경 필요
---------------------------------------------*/
const initialHandler = async (buffer: Buffer, socket: Socket, packetId: ePacketId) => {
  console.log('initialHandler: called');
  socket.removeAllListeners('data');

  if (packetId === ePacketId.G2L_Init) {
    let packet: G2L_Init;
    try {
      packet = fromBinary(G2L_InitSchema, buffer);
    } catch (error) {
      console.log(error);
      throw new CustomError(ErrorCodes.PACKET_DECODE_ERROR, '패킷 디코딩 중 오류가 발생했습니다');
    }

    //1. sessionManager에 로비세션 추가
    lobbySessionManager.addSession(packet.serverId, socket);
  }
  else {
    console.log("[initialHandler] 비정상적인 패킷")
  }
};

export default initialHandler;
