import { ePacketId } from "ServerCore/network/packetId";
import { BattleSession } from "../session/battleSession";
import { gameRoomManager } from "src/contents/room/gameRoomManager";


type PacketHandler = (buffer: Buffer, session: BattleSession) => void;

const handlerMappings: Record<ePacketId, PacketHandler> | any = {
  [ePacketId.G2B_CreateGameRoomRequest]: (buffer: Buffer, session: BattleSession) =>
    gameRoomManager.createGameRoomHandler(buffer, session),
  [ePacketId.G2B_JoinGameRoomRequest]: (buffer: Buffer, session: BattleSession) =>
    gameRoomManager.enterRoomHandler(buffer, session),
  [ePacketId.G2B_PlayerPositionUpdateRequest]: (buffer: Buffer, session: BattleSession) =>
    gameRoomManager.moveHandler(buffer, session),
  [ePacketId.G2B_TowerBuildRequest]:(buffer:Buffer,session:BattleSession)=>
    gameRoomManager.towerBuildHandler(buffer, session),
};

export default handlerMappings;
