import { Socket } from 'node:net';
import { LobbySession } from '../session/lobbySession.js';
import { BattleSession } from '../session/battleSession.js';
import { gameRoomManager } from '../../contents/room/GameRoomManager.js';
import { ePacketId } from 'ServerCore/src/network/packetId.js';

/**---------------------------------------------
 * @type {Object.<ePacketId, Function>}
 * 패킷 ID에 따른 핸들러 매핑
 ---------------------------------------------*/
const lobbyHandlerMappings = {
  [ePacketId.L2B_CreateRoom]: (buffer, session) =>
    gameRoomManager.createGameRoomHandler(buffer, session),
  [ePacketId.S2C_Error]: (buffer, session) => {
    console.log('에러 ㅇㅇ');
  },
};

export default lobbyHandlerMappings;
