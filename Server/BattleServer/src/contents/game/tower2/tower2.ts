import { PosInfo } from 'src/protocol/struct_pb';
import { CreateTower } from './createTower';
import { GameRoom } from 'src/contents/room/gameRoom';
import { Tower } from '../tower';
import { BasicTower } from './basicTower';
import { MissileTower } from './MissileTower';

export class Tower2 {
  private createTower: CreateTower | null = null;
  private tower: Tower | null = null;
  constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
    this.tower = CreateTower.createTower(prefabId, pos, room);
  }

  attackTarget(target: Monster) {
    this.createTower?.processAttack(target);
  }
}
