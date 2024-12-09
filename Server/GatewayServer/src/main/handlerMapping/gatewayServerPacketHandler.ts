import { ePacketId } from "ServerCore/network/packetId";
import { BattleSession } from "../session/battleSession";
import { GatewaySession } from "../session/gatewaySession";


type PacketHandler = (buffer: Buffer, session: GatewaySession) => void;

const gatewayHandlerMappings: Record<ePacketId, PacketHandler> | any = {

};

export default gatewayHandlerMappings;
