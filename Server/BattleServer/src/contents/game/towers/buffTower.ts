import { GameRoom } from 'src/contents/room/gameRoom';
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

    const towers = this.getTowersInRange();
    for(let tower of towers){
      tower.applyAttackBuff();
    }
  }

  /**---------------------------------------------
   * [버프 적용]
   ---------------------------------------------*/

   override onDeath(): void {
    super.onDeath();

    const towersInRange: Tower[] = this.getTowersInRange();
    for (let i = 0; i < towersInRange.length; i++) {
        if (!towersInRange[i].isBuffTowerInRange()) {
          towersInRange[i].removeAttackBuff();
        }
    }
  }
}
