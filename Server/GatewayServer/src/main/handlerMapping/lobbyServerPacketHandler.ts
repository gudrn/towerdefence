import { ePacketId } from "ServerCore/network/packetId";
import { LobbySession } from "../session/lobbySession";

type PacketHandler = (buffer: Buffer, session: LobbySession) => void;

const lobbyHandlerMappings: Record<ePacketId, PacketHandler> | any = {

};

export default lobbyHandlerMappings;
