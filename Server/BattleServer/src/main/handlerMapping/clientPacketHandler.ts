import { ePacketId } from "ServerCore/network/packetId";
import { BattleSession } from "../session/battleSession";
import { gameRoomManager } from "src/contents/room/gameRoomManager";


type PacketHandler = (buffer: Buffer, session: BattleSession) => void;

const handlerMappings: Record<ePacketId, PacketHandler> | any = {
  [ePacketId.C2B_PositionUpdateRequest]: (buffer: Buffer, session: BattleSession) =>
    gameRoomManager.moveHandler(buffer, session),
  [ePacketId.C2B_TowerBuildRequest]: (buffer: Buffer, session: BattleSession) =>
    gameRoomManager.towerBuildHandler(buffer, session),
  [ePacketId.C2B_SkillRequest]: (buffer: Buffer, session: BattleSession) =>
    gameRoomManager.skillHandler(buffer, session),
  [ePacketId.C2B_UseCardRequest]: (buffer: Buffer, session: BattleSession) =>
    gameRoomManager.useCardHandler(buffer, session),
  [ePacketId.S2C_Error]: (buffer: Buffer, session: BattleSession) => {
    console.log('에러 ㅇㅇ');
  },
};

export default handlerMappings;
