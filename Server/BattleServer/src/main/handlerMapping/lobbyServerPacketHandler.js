import { Socket } from 'node:net';
import { LobbySession } from 'src/Main/network/LobbySession';
import { BattleSession } from 'src/Main/network/BattleSession';
import { gameRoomManager } from 'src/Game/GameRoomManager';
import defaultHandler from 'ServerCore/utils/default.handler';

/**---------------------------------------------
 * @type {Object.<ePacketId, Function>}
 * 패킷 ID에 따른 핸들러 매핑
 ---------------------------------------------*/
const lobbyHandlerMappings = {
  [ePacketId.L2B_CreateRoom]: (buffer, session) => gameRoomManager.createGameRoomHandler(buffer, session),
  [ePacketId.L2B_Init]: (buffer, session) => defaultHandler(buffer, session),
  [ePacketId.B2L_CreateRoom]: (buffer, session) => defaultHandler(buffer, session),
  [ePacketId.B2L_Init]: (buffer, session) => defaultHandler(buffer, session),
  [ePacketId.S2C_Error]: (buffer, session) => {
    console.log('에러 ㅇㅇ');
  },
};

export default lobbyHandlerMappings;
