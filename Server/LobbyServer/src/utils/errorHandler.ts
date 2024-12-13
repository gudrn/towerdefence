import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { LobbySession } from "src/main/session/lobbySession";


export const handleError = (session: LobbySession, error: any) => {
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
  
    // const packet: ErrorData = ResponseUtils.createErrorResponse(responseCode, message);
    // const sendBuffer: Buffer = PacketUtils.SerializePacket<ErrorData>(
    //   packet,
    //   ErrorDataSchema,
    //   ePacketId.S2C_Error,
    //   session.getNextSequence(),
    // );
    // session.send(sendBuffer);
  };
  