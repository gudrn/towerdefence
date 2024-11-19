import { ePacketId } from "servercore/src/network/packetId.js";
import { roomManager } from "../../contents/room/roomManager.js";

/**
 * @type {Object.<ePacketId, Function>}
 * 패킷 ID에 따른 핸들러 매핑
 */
const handlerMappings = {
  [ePacketId.C2L_CreateRoomRequest]: (buffer, session) =>
    roomManager.createRoomHandler(buffer, session),
  [ePacketId.C2L_JoinRoomRequest]: (buffer, session) =>
    roomManager.enterRoomHandler(buffer, session),
  [ePacketId.C2L_GetRoomListRequest]: (buffer, session) =>
    roomManager.getRoomsHandler(buffer, session),
  [ePacketId.C2L_GameStart]: (buffer, session) =>
    roomManager.gameStartHandler(buffer, session),

  [ePacketId.C2L_Init]: (buffer, session) => defaultHandler(buffer, session),
  [ePacketId.B2L_Init]: (buffer, session) => defaultHandler(buffer, session),

  [ePacketId.B2L_CreateRoom]: function (buffer, session) {
    console.log("B2L_CreateRoom ㅇㅇ");
  },

  [ePacketId.S2C_Error]: function (buffer, session) {
    console.log("에러 ㅇㅇ");
  },
};

export default handlerMappings;
