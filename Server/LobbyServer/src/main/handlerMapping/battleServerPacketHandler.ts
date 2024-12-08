import { ePacketId } from "ServerCore/network/packetId";
import { BattleSession } from "../session/battleSession";


type PacketHandler = (buffer: Buffer, session: BattleSession) => void;

const battleHandlerMappings: Record<ePacketId, PacketHandler> | any = {
  [ePacketId.B2L_CreateGameRoomRespone]: (buffer: Buffer, session: BattleSession) => roomManager.onGameStartHandler(buffer, session),
  [ePacketId.B2L_SocketDisconnectedNotification]: (buffer, session) => roomManager.onSocketDisconnectedHandler(buffer, session),
};

export default battleHandlerMappings;
