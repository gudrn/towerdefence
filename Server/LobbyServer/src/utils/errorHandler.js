"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = void 0;
const errorCodes_1 = require("ServerCore/utils/error/errorCodes");
const handleError = (session, error) => {
    let responseCode;
    let message = error.message;
    if (error.code) {
        responseCode = error.code;
        console.error(`에러 코드: ${error.code}, 메시지: ${error.message}`);
        console.log(error.stack.split('\n')[1]);
    }
    else {
        responseCode = errorCodes_1.ErrorCodes.SOCKET_ERROR;
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
exports.handleError = handleError;
//# sourceMappingURL=errorHandler.js.map