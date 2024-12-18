import { GameRoom } from 'src/contents/room/gameRoom';
import { PosInfo } from 'src/protocol/struct_pb';
import { Tower } from './tower';
import { SkillUseMonster } from '../skillUseMonster';
import { assetManager } from 'src/utils/assetManager';

export class IceTower extends Tower {
  public override splashDamage(target: SkillUseMonster): void {
    throw new Error('Method not implemented.');
  }
  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('IceTower');
    super(towerData, pos, room);
  }
  protected processAttack(target: SkillUseMonster) {
    target.onDamaged(this.attackDamage);
  }
}
