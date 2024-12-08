
import { roomManager } from "src/contents/room/roomManager";
import { LobbySession } from "../session/lobbySession";
import { ePacketId } from "ServerCore/network/packetId";

type PacketHandler = (buffer: Buffer, session: LobbySession) => void;

const handlerMappings: Record<ePacketId, PacketHandler> | any = {
  [ePacketId.C2L_CreateRoomRequest]: (buffer: Buffer, session: LobbySession) =>
    roomManager.createRoomHandler(buffer, session),
  [ePacketId.C2L_JoinRoomRequest]: (buffer: Buffer, session: LobbySession) =>
    roomManager.enterRoomHandler(buffer, session),
  [ePacketId.C2L_GetRoomListRequest]: (buffer, session) =>
    roomManager.getRoomsHandler(buffer, session),
  [ePacketId.C2L_GameStart]: (buffer: Buffer, session: LobbySession) =>
    roomManager.gameStartHandler(buffer, session),
  [ePacketId.C2L_LeaveRoomRequest]: (buffer: Buffer, session: LobbySession) =>
    roomManager.leaveRoomHandler(buffer, session),

  [ePacketId.S2C_Error]: function (buffer, session) {
    console.log("에러 ㅇㅇ");
  },
};

export default handlerMappings;
