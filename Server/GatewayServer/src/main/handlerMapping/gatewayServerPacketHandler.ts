import { ePacketId } from "ServerCore/network/packetId";
import { GatewaySession } from "../session/gatewaySession";
import { handleC2G_CreateRoomRequest, handleC2G_GetRoomListRequest, handleC2G_JoinRoomRequest } from '../handler/client/roomHandler';


type PacketHandler = (buffer: Buffer, session: GatewaySession) => void;

const gatewayHandlerMappings: Record<ePacketId, PacketHandler> | any = {
    [ePacketId.C2G_GetRoomListRequest]: (buffer: Buffer, session: GatewaySession) => handleC2G_GetRoomListRequest(buffer, session),
    [ePacketId.C2G_CreateRoomRequest]: (buffer: Buffer, session: GatewaySession) => handleC2G_CreateRoomRequest(buffer, session),
    [ePacketId.C2G_JoinRoomRequest]: (buffer: Buffer, session: GatewaySession) => handleC2G_JoinRoomRequest(buffer, session),
        
};

export default gatewayHandlerMappings;
