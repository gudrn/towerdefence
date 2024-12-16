import { ePacketId } from "ServerCore/network/packetId";
import { BattleSession } from "../session/battleSession";
import { handleB2G_CreateGameRoomResponse, handleB2G_GameStartNotification, handleB2G_JoinGameRoomResponse } from "../handler/battleServer/roomHandler";
import { handleB2G_InitCardData } from "../handler/battleServer/cardHandler";
import { handleB2G_PlayerPositionUpdateNotification, handleB2G_PlayerUseAbilityNotification, handleB2G_UseSkillNotification } from "../handler/battleServer/playerHandler";
import { handleB2G_MonsterAttackBaseNotification, handleB2G_MonsterAttackTowerNotification, handleB2G_MonsterBuffNotification, handleB2G_MonsterDeathNotification, handleB2G_MonsterHealthUpdateNotification, handleB2G_MonsterPositionUpdateNotification, handleB2G_SpawnMonsterNotification } from "../handler/battleServer/monsterHandler";
import { handleB2G_TowerAttackMonsterNotification, handleB2G_TowerBuffNotification, handleB2G_TowerBuildNotification, handleB2G_TowerDestroyNotification, handleB2G_TowerHealthUpdateNotification } from "../handler/battleServer/towerHandler";

type PacketHandler = (buffer: Buffer, session: BattleSession) => void;

const battleHandlerMappings: Record<ePacketId, PacketHandler> | any = {
    [ePacketId.B2G_CreateGameRoomResponse]: (buffer: Buffer, session: BattleSession) => handleB2G_CreateGameRoomResponse(buffer, session),
    [ePacketId.B2G_JoinGameRoomResponse]: (buffer: Buffer, session: BattleSession) => handleB2G_JoinGameRoomResponse(buffer, session),
    [ePacketId.B2G_GameStartNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_GameStartNotification(buffer, session),
    [ePacketId.B2G_InitCardData]: (buffer: Buffer, session: BattleSession) => handleB2G_InitCardData(buffer, session),
    [ePacketId.B2G_PlayerPositionUpdateNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_PlayerPositionUpdateNotification(buffer, session),
    [ePacketId.B2G_SpawnMonsterNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_SpawnMonsterNotification(buffer, session),
    [ePacketId.B2G_MonsterPositionUpdateNotification]:(buffer: Buffer, session: BattleSession) =>handleB2G_MonsterPositionUpdateNotification(buffer, session),

    [ePacketId.B2G_MonsterAttackTowerNotification]:(buffer: Buffer, session: BattleSession) =>handleB2G_MonsterAttackTowerNotification(buffer, session),
    [ePacketId.B2G_MonsterAttackBaseNotification]:(buffer: Buffer, session: BattleSession) =>handleB2G_MonsterAttackBaseNotification(buffer, session),
    [ePacketId.B2G_MonsterDeathNotification]:(buffer: Buffer, session: BattleSession) =>handleB2G_MonsterDeathNotification(buffer, session),
    [ePacketId.B2G_MonsterHealthUpdateNotification]:(buffer: Buffer, session: BattleSession) =>handleB2G_MonsterHealthUpdateNotification(buffer, session),

    [ePacketId.B2G_TowerAttackMonsterNotification]:(buffer: Buffer, session: BattleSession) => handleB2G_TowerAttackMonsterNotification(buffer, session),
    [ePacketId.B2G_TowerBuildNotification]:(buffer: Buffer, session: BattleSession) => handleB2G_TowerBuildNotification(buffer, session),
    [ePacketId.B2G_TowerDestroyNotification]:(buffer: Buffer, session: BattleSession) => handleB2G_TowerDestroyNotification(buffer, session),
    [ePacketId.B2G_TowerBuffNotification]:(buffer: Buffer, session: BattleSession) => handleB2G_TowerBuffNotification(buffer, session),
    [ePacketId.B2G_TowerHealthUpdateNotification]:(buffer: Buffer, session: BattleSession) => handleB2G_TowerHealthUpdateNotification(buffer, session),
    [ePacketId.B2G_UseSkillNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_UseSkillNotification(buffer, session),
    [ePacketId.B2G_MonsterBuffNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_MonsterBuffNotification(buffer, session),
    [ePacketId.B2G_PlayerUseAbilityNotification]: (buffer: Buffer, session: BattleSession) => handleB2G_PlayerUseAbilityNotification(buffer, session),



};

export default battleHandlerMappings;
