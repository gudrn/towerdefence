import { fromBinary } from '@bufbuild/protobuf';
import { Socket } from 'net';
import { config } from 'ServerCore/config/config';
import { ePacketId } from 'ServerCore/network/packetId';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { C2B_Init, C2B_InitSchema } from 'src/protocol/init_pb';
import { sessionManager } from 'src/server';
import { BattleSession } from '../session/battleSession';
import { GamePlayer } from 'src/contents/game/gamePlayer';
import { gameRoomManager } from 'src/contents/room/gameRoomManager';
import { GameRoom } from 'src/contents/room/gameRoom.js';

export const onConnection = (socket: Socket): void => {
  console.log('새로운 연결이 감지되었습니다:', socket.remoteAddress, socket.remotePort);

  let buffer = Buffer.alloc(0);

  socket.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);

    // 최소한 헤더는 파싱할 수 있어야 한다
    if (buffer.length < config.packet.sizeOfHeader) {
      return;
    }

    let header = PacketUtils.readPacketHeader(buffer);
    // 헤더에 기록된 패킷 크기를 파싱할 수 있어야 한다
    if (buffer.length < header.size) {
      console.log('파싱X', buffer.length, header.size);
      return;
    }

    const packet = buffer.subarray(config.packet.sizeOfHeader, header.size);

    if (header.id == ePacketId.C2B_Init) {
      console.log('클라 접속');
      initialHandler(packet, socket);
    } else {
      console.log('비정상적인 접속');
      socket.destroy();
    }
  });
};

/*---------------------------------------------
    [초기화 핸들러]
---------------------------------------------*/
const initialHandler = async (buffer: Buffer, socket: Socket) => {
  console.log('initialHandler: called', socket.remoteAddress, socket.remotePort);

  let packet: C2B_Init;
  try {
    packet = fromBinary(C2B_InitSchema, buffer);
  } catch (error) {
    console.log(error);
    throw new CustomError(ErrorCodes.PACKET_DECODE_ERROR, '패킷 디코딩 중 오류가 발생했습니다1');
  }

  //3. sessionManager에 세션 추가
  let session: BattleSession;
  // 세션이 생성되었으므로, 더 이상 주체 판별이 필요하지 않음
  if (packet.playerData) {
    session = sessionManager.addSession(packet.playerData.position!.uuid, socket);
  } else {
    throw new CustomError(ErrorCodes.PACKET_DECODE_ERROR, '패킷 디코딩 중 오류가 발생했습니다2');
  }

  sessionManager
    .getSessionOrNull(packet.playerData.position!.uuid)
    ?.setNickname(packet.playerData.nickname);

  const player = new GamePlayer(session, packet.playerData);
  gameRoomManager.enterRoomHandler(packet.roomId, player);
};

export default initialHandler;
