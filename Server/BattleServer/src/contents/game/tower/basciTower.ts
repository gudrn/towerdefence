import { PosInfo } from 'src/protocol/struct_pb';
import { SkillUseMonster } from '../skillUseMonster';
import { Tower } from './tower';
import { GameRoom } from 'src/contents/room/gameRoom';
import { assetManager } from 'src/utils/assetManager';

export class BasicTower extends Tower {
  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('BasicTower');
    super(towerData, pos, room);
  }

  protected processAttack(target: SkillUseMonster) {
    target.onDamaged(this.attackDamage);
  }
}
