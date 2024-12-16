import { ePacketId } from 'ServerCore/network/packetId';
import { GatewaySession } from '../session/gatewaySession';
import {
  handleC2G_CreateRoomRequest,
  handleC2G_GameStartRequest,
  handleC2G_GetRoomListRequest,
  handleC2G_JoinGameRoomRequest,
  handleC2G_JoinRoomRequest,
  handleChatMessage,
} from '../handler/client/roomHandler';
import {
  handleC2G_PlayerPositionUpdateRequest,
  handleC2G_PlayerUseAbilityRequest,
  handleC2G_TowerBuildRequest,
  handleC2G_UseSkillRequest,
} from '../handler/client/playerHandler';

type PacketHandler = (buffer: Buffer, session: GatewaySession) => void;

const gatewayHandlerMappings: Record<ePacketId, PacketHandler> | any = {
  [ePacketId.C2G_GetRoomListRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_GetRoomListRequest(buffer, session),
  [ePacketId.C2G_CreateRoomRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_CreateRoomRequest(buffer, session),
  [ePacketId.C2G_JoinRoomRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_JoinRoomRequest(buffer, session),
  [ePacketId.C2G_GameStartRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_GameStartRequest(buffer, session),
  [ePacketId.C2G_JoinGameRoomRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_JoinGameRoomRequest(buffer, session),
  [ePacketId.C2G_PlayerPositionUpdateRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_PlayerPositionUpdateRequest(buffer, session),
  [ePacketId.C2G_TowerBuildRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_TowerBuildRequest(buffer, session),
  [ePacketId.C2G_UseSkillRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_UseSkillRequest(buffer, session),
  [ePacketId.C2G_PlayerUseAbilityRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleC2G_PlayerUseAbilityRequest(buffer, session),
  [ePacketId.C2G_ChatMessageRequest]: (buffer: Buffer, session: GatewaySession) =>
    handleChatMessage(buffer, session),
};

export default gatewayHandlerMappings;
