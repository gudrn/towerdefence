import { GameRoom } from 'src/contents/room/gameRoom';
import { SkillUseMonster } from '../skillUseMonster';
import { Tower } from './tower';
import { PosInfo } from 'src/protocol/struct_pb';
import { assetManager } from 'src/utils/assetManager';
import { create } from '@bufbuild/protobuf';
import { B2G_TowerBuffNotificationSchema } from 'src/protocol/tower_pb';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';

export class BuffTower extends Tower {
  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('BuffTower');
    super(towerData, pos, room);
  }

  protected processAttack(target: SkillUseMonster) {
    target.onDamaged(this.attackDamage);
    //this.buffTowersInRange();
  }

  public override splashDamage(target: SkillUseMonster): void {
    throw new Error('Method not implemented.');
  }
}
