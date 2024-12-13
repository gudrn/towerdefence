import { ePacketId } from "ServerCore/network/packetId";
import { BattleSession } from "../session/battleSession";
import { handleB2G_CreateGameRoomResponse, handleB2G_GameStartNotification, handleB2G_JoinGameRoomResponse } from "../handler/battleServer/roomHandler";
import { handleB2G_InitCardData } from "../handler/battleServer/cardHandler";
import { handleB2G_PlayerPositionUpdateNotification } from "../handler/battleServer/playerHandler";
import { handleB2G_MonsterPositionUpdateNotification, handleB2G_SpawnMonsterNotification } from "../handler/battleServer/monsterHandler";

type PacketHandler = (buffer: Buffer, session: BattleSession) => void;

const battleHandlerMappings: Record<ePacketId, PacketHandler> | any = {
    [ePacketId.B2G_CreateGameRoomResponse]: (buffer: Buffer, session: BattleSession) => handleB2G_CreateGameRoomResponse(buffer, session),
    [ePacketId.B2G_JoinGameRoomResponse]: (buffer: Buffer, session: BattleSession) => handleB2G_JoinGameRoomResponse(buffer, session),
    [ePacketId.B2G_GameStartNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_GameStartNotification(buffer, session),
    [ePacketId.B2G_InitCardData]: (buffer: Buffer, session: BattleSession) => handleB2G_InitCardData(buffer, session),
    [ePacketId.B2G_PlayerPositionUpdateNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_PlayerPositionUpdateNotification(buffer, session),
    [ePacketId.B2G_SpawnMonsterNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_SpawnMonsterNotification(buffer, session),
    [ePacketId.B2G_MonsterPositionUpdateNotification]:(buffer: Buffer, session: BattleSession) =>handleB2G_MonsterPositionUpdateNotification(buffer, session),
};

export default battleHandlerMappings;
