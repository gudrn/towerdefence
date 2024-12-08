

/**---------------------------------------------
 * @type {Object.<ePacketId, Function>}
 * 패킷 ID에 따른 핸들러 매핑
 ---------------------------------------------*/
const lobbyHandlerMappings = {
  [ePacketId.L2B_CreateGameRoomRequest]: (buffer, session) =>
    gameRoomManager.createGameRoomHandler(buffer, session),
  [ePacketId.S2C_Error]: function (buffer, session) {
    console.log('에러 ㅇㅇ');
  },
};

export default lobbyHandlerMappings;
