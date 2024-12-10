import { ePacketId } from "ServerCore/network/packetId";
import { LobbySession } from "../session/lobbySession";
import { handleL2G_CreateRoomResponse, handleL2G_GetRoomListResponse, handleL2G_JoinRoomNotification, handleL2G_JoinRoomResponse } from "../handler/lobbyServer/roomHandler";

type PacketHandler = (buffer: Buffer, session: LobbySession) => void;

const lobbyHandlerMappings: Record<ePacketId, PacketHandler> | any = {
    [ePacketId.L2G_GetRoomListResponse]: (buffer: Buffer, session: LobbySession) => handleL2G_GetRoomListResponse(buffer, session),
    [ePacketId.L2G_CreateRoomResponse]: (buffer: Buffer, session: LobbySession) => handleL2G_CreateRoomResponse(buffer, session),
    [ePacketId.L2G_JoinRoomResponse]: (buffer: Buffer, session: LobbySession) => handleL2G_JoinRoomResponse(buffer, session),
    [ePacketId.L2G_JoinRoomNotification]: (buffer: Buffer, session: LobbySession) => handleL2G_JoinRoomNotification(buffer, session),

};

export default lobbyHandlerMappings;
