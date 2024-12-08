import { create, fromBinary } from "@bufbuild/protobuf";
import { config } from "ServerCore/config/config";
import { ePacketId } from "ServerCore/network/packetId";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { B2L_InitSchema, C2L_InitSchema, L2C_InitSchema } from "src/protocol/init_pb";
import { battleSessionManager, lobbySessionManager } from "../../server";


export const onConnection = (socket) => {
  console.log('새로운 연결이 감지되었습니다:', socket.remoteAddress, socket.remotePort);

  let buffer = Buffer.alloc(0);

  socket.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);

    if (buffer.length < config.packet.sizeOfHeader) {
      return;
    }

    let header = PacketUtils.readPacketHeader(buffer);
    if (buffer.length < header.size) {
      console.log('파싱X', buffer.length, header.size);
      return;
    }

    const packet = buffer.subarray(config.packet.sizeOfHeader, header.size);

    switch (header.id) {
      case ePacketId.C2L_Init:
        console.log('클라 접속');
        initialHandler(packet, socket, ePacketId.C2L_Init);
        break;
      case ePacketId.B2L_Init:
        console.log('배틀 서버 접속');
        initialHandler(packet, socket, ePacketId.B2L_Init);
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
const initialHandler = async (buffer, socket, packetId) => {
  console.log('initialHandler: called');
  socket.removeAllListeners('data');

  if (packetId === ePacketId.C2L_Init) {
    let packet;
    try {
      packet = fromBinary(C2L_InitSchema, buffer);
    } catch (error) {
      console.log(error);
      throw new CustomError(ErrorCodes.PACKET_DECODE_ERROR, '패킷 디코딩 중 오류가 발생했습니다');
    }

    //1. sessionManager에 로비세션 추가
    lobbySessionManager.addSession(packet.userId, socket).setNickname(packet.nickname);

    //2. 유저 정보 응답 생성
    const initPacket = create(L2C_InitSchema, {
      isSuccess: true
    });

    //3. 유저 정보 직렬화
    const sendBuffer = PacketUtils.SerializePacket(
      initPacket,
      L2C_InitSchema,
      ePacketId.L2C_Init,
      0,
    );

    //4. 버퍼 전송
    lobbySessionManager.getSessionOrNull(packet.userId)?.send(sendBuffer);
  }
  //배틀 서버 접속
  else if (packetId === ePacketId.B2L_Init) {
    let packet;
    try {
      packet = fromBinary(B2L_InitSchema, buffer);
    } catch (error) {
      throw new CustomError(ErrorCodes.PACKET_DECODE_ERROR, '패킷 디코딩 중 오류가 발생했습니다2');
    }
    battleSessionManager.addSession(packet.serverId, socket);
  }
};

export default initialHandler;
