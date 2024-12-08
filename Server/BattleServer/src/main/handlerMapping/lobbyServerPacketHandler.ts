import { ePacketId } from "ServerCore/network/packetId";
import { LobbySession } from "../session/lobbySession";
import { gameRoomManager } from "src/contents/room/gameRoomManager";


type PacketHandler = (buffer: Buffer, session: LobbySession) => void;

const lobbyHandlerMappings: Record<ePacketId, PacketHandler> | any = {
  [ePacketId.L2B_CreateGameRoomRequest]: (buffer: Buffer, session: LobbySession) =>
    gameRoomManager.createGameRoomHandler(buffer, session),
  [ePacketId.S2C_Error]: function (buffer: Buffer, session: LobbySession) {
    console.log('에러 ㅇㅇ');
  },
};

export default lobbyHandlerMappings;
