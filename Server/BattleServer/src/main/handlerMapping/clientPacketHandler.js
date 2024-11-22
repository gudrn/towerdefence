import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { gameRoomManager } from '../../contents/room/GameRoomManager.js';

/**
 * @type {Object.<ePacketId, Function>}
 * 패킷 ID에 따른 핸들러 매핑
 */
const handlerMappings = {
  [ePacketId.L2B_CreateRoom]: (buffer, session) =>
    gameRoomManager.createGameRoomHandler(buffer, session),
  [ePacketId.C2B_Move]: (buffer, session) => gameRoomManager.moveHandler(buffer, session),
  [ePacketId.S2C_Error]: (buffer, session) => {
    console.log('에러 ㅇㅇ');
  },
};

export default handlerMappings;
