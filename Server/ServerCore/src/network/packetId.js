"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ePacketId = void 0;
/*---------------------------------------------
    [접두사]
    - S2C: 서버->클라

    - C2L / L2C
        클라<->로비 서버
    - C2B / B2C
        클라->배틀 서버
    - L2B / B2L
        로비 서버 <-> 배틀 서버
---------------------------------------------*/
//cursor
var ePacketId;
(function (ePacketId) {
    ePacketId[ePacketId["S2C_Error"] = 0] = "S2C_Error";
    ePacketId[ePacketId["C2L_Init"] = 1] = "C2L_Init";
    ePacketId[ePacketId["L2C_Init"] = 2] = "L2C_Init";
    ePacketId[ePacketId["B2L_Init"] = 3] = "B2L_Init";
    ePacketId[ePacketId["C2B_Init"] = 4] = "C2B_Init";
    ePacketId[ePacketId["C2L_CreateRoomRequest"] = 101] = "C2L_CreateRoomRequest";
    ePacketId[ePacketId["L2C_CreateRoomResponse"] = 102] = "L2C_CreateRoomResponse";
    ePacketId[ePacketId["L2B_CreateGameRoomRequest"] = 103] = "L2B_CreateGameRoomRequest";
    ePacketId[ePacketId["B2L_CreateGameRoomRespone"] = 104] = "B2L_CreateGameRoomRespone";
    ePacketId[ePacketId["C2L_GameStart"] = 105] = "C2L_GameStart";
    ePacketId[ePacketId["L2C_GameStart"] = 106] = "L2C_GameStart";
    ePacketId[ePacketId["L2B_GameStartRequest"] = 107] = "L2B_GameStartRequest";
    ePacketId[ePacketId["B2C_GameStartNotification"] = 108] = "B2C_GameStartNotification";
    ePacketId[ePacketId["C2L_GetRoomListRequest"] = 109] = "C2L_GetRoomListRequest";
    ePacketId[ePacketId["L2C_GetRoomListResponse"] = 110] = "L2C_GetRoomListResponse";
    ePacketId[ePacketId["C2L_JoinRoomRequest"] = 111] = "C2L_JoinRoomRequest";
    ePacketId[ePacketId["L2C_JoinRoomResponse"] = 112] = "L2C_JoinRoomResponse";
    ePacketId[ePacketId["L2C_JoinRoomNotification"] = 113] = "L2C_JoinRoomNotification";
    ePacketId[ePacketId["C2L_LeaveRoomRequest"] = 114] = "C2L_LeaveRoomRequest";
    ePacketId[ePacketId["L2C_LeaveRoomResponse"] = 115] = "L2C_LeaveRoomResponse";
    ePacketId[ePacketId["L2C_LeaveRoomNotification"] = 116] = "L2C_LeaveRoomNotification";
    ePacketId[ePacketId["B2C_JoinRoomResponse"] = 117] = "B2C_JoinRoomResponse";
    ePacketId[ePacketId["B2C_increaseWaveNotification"] = 118] = "B2C_increaseWaveNotification";
    ePacketId[ePacketId["B2C_SpawnMonsterNotification"] = 201] = "B2C_SpawnMonsterNotification";
    ePacketId[ePacketId["B2C_MonsterPositionUpdateNotification"] = 202] = "B2C_MonsterPositionUpdateNotification";
    ePacketId[ePacketId["B2C_MonsterAttackTowerNotification"] = 203] = "B2C_MonsterAttackTowerNotification";
    ePacketId[ePacketId["B2C_MonsterAttackBaseNotification"] = 204] = "B2C_MonsterAttackBaseNotification";
    ePacketId[ePacketId["B2C_MonsterDeathNotification"] = 205] = "B2C_MonsterDeathNotification";
    ePacketId[ePacketId["C2B_TowerBuildRequest"] = 301] = "C2B_TowerBuildRequest";
    ePacketId[ePacketId["B2C_TowerBuildResponse"] = 302] = "B2C_TowerBuildResponse";
    ePacketId[ePacketId["B2C_TowerBuildNotification"] = 303] = "B2C_TowerBuildNotification";
    ePacketId[ePacketId["B2C_TowerAttackMonsterNotification"] = 304] = "B2C_TowerAttackMonsterNotification";
    ePacketId[ePacketId["B2C_TowerDestroyNotification"] = 305] = "B2C_TowerDestroyNotification";
    ePacketId[ePacketId["B2C_BaseDestroyNotification"] = 306] = "B2C_BaseDestroyNotification";
    ePacketId[ePacketId["B2C_ObstacleSpawnNotification"] = 307] = "B2C_ObstacleSpawnNotification";
    ePacketId[ePacketId["B2C_TowerHealthUpdateNotification"] = 308] = "B2C_TowerHealthUpdateNotification";
    ePacketId[ePacketId["C2B_SkillRequest"] = 401] = "C2B_SkillRequest";
    ePacketId[ePacketId["B2C_SkillResponse"] = 402] = "B2C_SkillResponse";
    ePacketId[ePacketId["B2C_SkillNotify"] = 403] = "B2C_SkillNotify";
    ePacketId[ePacketId["C2B_PositionUpdateRequest"] = 501] = "C2B_PositionUpdateRequest";
    ePacketId[ePacketId["B2C_PlayerPositionUpdateNotification"] = 502] = "B2C_PlayerPositionUpdateNotification";
    ePacketId[ePacketId["C2B_UseCardRequest"] = 503] = "C2B_UseCardRequest";
    ePacketId[ePacketId["B2C_UseSkillNotification"] = 504] = "B2C_UseSkillNotification";
    ePacketId[ePacketId["B2C_MonsterHealthUpdateNotification"] = 505] = "B2C_MonsterHealthUpdateNotification";
    ePacketId[ePacketId["B2C_InitCardData"] = 506] = "B2C_InitCardData";
    ePacketId[ePacketId["B2C_AddCard"] = 507] = "B2C_AddCard";
    ePacketId[ePacketId["B2L_SocketDisconnectedNotification"] = 508] = "B2L_SocketDisconnectedNotification";
    ePacketId[ePacketId["B2C_GameEndNotification"] = 509] = "B2C_GameEndNotification";
})(ePacketId || (exports.ePacketId = ePacketId = {}));
;
//# sourceMappingURL=packetId.js.map