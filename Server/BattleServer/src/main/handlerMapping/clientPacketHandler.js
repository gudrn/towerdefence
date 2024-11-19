import defaultHandler from 'ServerCore/handlers/default.handler';
import { gameRoomManager } from 'src/classes/managers/GameRoomManager';

/**
 * @type {Object.<ePacketId, Function>}
 * 패킷 ID에 따른 핸들러 매핑
 */
const handlerMappings = {
  [ePacketId.L2B_CreateRoom]: (buffer, session) => gameRoomManager.createGameRoomHandler(buffer, session),
  [ePacketId.L2B_Init]: (buffer, session) => defaultHandler(buffer, session),
  [ePacketId.C2B_Move]: (buffer, session) => gameRoomManager.moveHandler(buffer, session),
  [ePacketId.S2C_Error]: (buffer, session) => {
    console.log('에러 ㅇㅇ');
  },
};

export default handlerMappings;
