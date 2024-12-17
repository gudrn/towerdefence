import { GameRoom } from 'src/contents/room/gameRoom';
import { SkillUseMonster } from '../skillUseMonster';
import { Tower } from './tower';
import { PosInfo } from 'src/protocol/struct_pb';
import { assetManager } from 'src/utils/assetManager';

export class BuffTower extends Tower {
  private buffAmount: number = 0;

  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('BuffTower');
    super(towerData, pos, room);
  }

  protected processAttack(target: SkillUseMonster) {
    target.onDamaged(this.attackDamage);
    //this.buffTowersInRange();
  }
}
