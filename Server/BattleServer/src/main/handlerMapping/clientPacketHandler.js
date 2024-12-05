import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { gameRoomManager } from '../../contents/room/gameRoomManager.js';

/**
 * @type {Object.<ePacketId, Function>}
 * 패킷 ID에 따른 핸들러 매핑
 */
const handlerMappings = {
  [ePacketId.L2B_CreateRoom]: (buffer, session) =>
    gameRoomManager.createGameRoomHandler(buffer, session),
  [ePacketId.C2B_PositionUpdateRequest]: (buffer, session) =>
    gameRoomManager.moveHandler(buffer, session),
  [ePacketId.C2B_TowerBuildRequest]: (buffer, session) =>
    gameRoomManager.towerBuildHandler(buffer, session),
  [ePacketId.B2C_TowerAttackRequest]: (buffer, session) =>
    gameRoomManager.towerAttackHandler(buffer, session),
  [ePacketId.C2B_TowerDestroyRequest]: (buffer, session) =>
    gameRoomManager.towerDestroyHandler(buffer, session),
  [ePacketId.C2B_SkillRequest]: (buffer, session) =>
    gameRoomManager.skillHandler(buffer, session),
  [ePacketId.C2B_UseCardRequest]: (buffer, session) =>
    gameRoomManager.useCardHandler(buffer, session),
  [ePacketId.S2C_Error]: (buffer, session) => {
    console.log('에러 ㅇㅇ');
  },
};

export default handlerMappings;
