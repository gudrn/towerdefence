import { PosInfo } from 'src/protocol/struct_pb';
import { Tower } from './tower';
import { GameRoom } from 'src/contents/room/gameRoom';
import { SkillUseMonster } from '../skillUseMonster';
import { assetManager } from 'src/utils/assetManager';

export class TankTower extends Tower {
  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('TankTower');
    super(towerData, pos, room);
  }

  protected processAttack(target: SkillUseMonster) {
    target.onDamaged(this.attackDamage);
  }

  public override splashDamage(target: SkillUseMonster): void {
    throw new Error('Method not implemented.');
  }
}
