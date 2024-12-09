import { ePacketId } from "ServerCore/network/packetId";
import { BattleSession } from "../session/battleSession";

type PacketHandler = (buffer: Buffer, session: BattleSession) => void;

const battleHandlerMappings: Record<ePacketId, PacketHandler> | any = {

};

export default battleHandlerMappings;
