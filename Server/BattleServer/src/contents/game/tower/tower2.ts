import { PosInfo } from 'src/protocol/struct_pb';
import { GameRoom } from 'src/contents/room/gameRoom';
import { CreateTower } from './createTower';
import { Tower } from './tower';
export class Tower2 {
  private pos: PosInfo;
  private room: GameRoom;
  private tower: Tower;
  constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
    this.pos = pos;
    this.room = room;
    this.tower = CreateTower.createTower(prefabId, pos, room);
  }
}
