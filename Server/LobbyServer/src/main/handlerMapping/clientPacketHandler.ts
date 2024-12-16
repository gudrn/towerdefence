import { createRoomHandler, deleteGameRoomHandler, enterRoomHandler, gameStartHandler, getRoomsHandler } from "../handler/roomHandler";
import { LobbySession } from "../session/lobbySession";
import { ePacketId } from "ServerCore/network/packetId";

type PacketHandler = (buffer: Buffer, session: LobbySession) => void;

const handlerMappings: Record<ePacketId, PacketHandler> | any = {
  [ePacketId.G2L_CreateRoomRequest]: (buffer: Buffer, session: LobbySession) =>
    createRoomHandler(buffer, session),
  [ePacketId.G2L_JoinRoomRequest]: (buffer: Buffer, session: LobbySession) =>
    enterRoomHandler(buffer, session),
  [ePacketId.G2L_GetRoomListRequest]: (buffer, session) =>
    getRoomsHandler(buffer, session),
  [ePacketId.G2L_GameStartRequest]: (buffer, session) =>
    gameStartHandler(buffer, session),
  [ePacketId.G2L_DeleteGameRoomRequest]: (buffer, session) =>
    deleteGameRoomHandler(buffer, session),
  [ePacketId.S2C_Error]: function (buffer, session) {
    console.log("에러 ㅇㅇ");
  },
};

export default handlerMappings;
