import { v4 as uuidv4 } from 'uuid';
import { GameRoom } from 'src/contents/room/gameRoom';
import { CreateTower } from './createTower';
import { PosInfo } from 'src/protocol/struct_pb';
import { Tower2 } from './tower2';
export class TowerManager {
  private towers: Map<string, Tower2> = new Map();
  private room: GameRoom;

  constructor(room: GameRoom) {
    this.room = room;
  }

  public addTower(towerType: string, pos: PosInfo) {
    const towerId = uuidv4();
    const tower = new Tower2(towerType, pos, this.room);
    this.towers.set(towerId, tower);
  }

  public getTower(towerId: string) {
    return this.towers.get(towerId);
  }
}
