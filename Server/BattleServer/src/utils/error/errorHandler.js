import { ePacketId } from '../../../../ServerCore/src/network/packetId.js';
import { ErrorCodes } from '../../../../ServerCore/src/utils/error/errorCodes.js';
import { ResponseUtils } from '../responseUtils.js';
import { PacketUtils } from '../../../../ServerCore/src/utils/packetUtils.js';

export const handleError = (session, error) => {
  let responseCode;
  let message = error.message;
  if (error.code) {
    responseCode = error.code;
    console.error(`에러 코드: ${error.code}, 메시지: ${error.message}`);
    console.log(error.stack.split('\n')[1]);
  } else {
    responseCode = ErrorCodes.SOCKET_ERROR;
    console.error(`일반 에러: ${error.message}`);
    console.log(error.stack.split('\n')[1]);
  }

  const packet = ResponseUtils.createErrorResponse(responseCode, message);
  const sendBuffer = PacketUtils.SerializePacket(
    packet,
    S2C_ErrorSchema,
    ePacketId.S2C_Error,
    session.getNextSequence(),
  );
  session.send(sendBuffer);
};
