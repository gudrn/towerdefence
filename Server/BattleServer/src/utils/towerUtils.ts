import { GameRoom } from 'src/contents/room/gameRoom';
import { Tower } from '../contents/game/towers/tower';

import { PosInfo } from 'src/protocol/struct_pb';
import { BasicTower } from 'src/contents/game/towers/basicTower';
import { MissileTower } from 'src/contents/game/towers/missileTower';
import { ThunderTower } from 'src/contents/game/towers/thunderTower';
import { TankTower } from 'src/contents/game/towers/tankTower';
import { StrongTower } from 'src/contents/game/towers/strongTower';
import { IceTower } from 'src/contents/game/towers/iceTower';
import { BuffTower } from 'src/contents/game/towers/buffTower';

/**
 * 캐릭터 등록
 */
export class TowerUtils {
  static createTower(prefabId: string, pos: PosInfo, room: GameRoom): Tower {
    switch (prefabId) {
      case 'BasicTower':
        return new BasicTower(pos, room);
      case 'MissileTower':
        return new MissileTower(pos, room);
      case 'ThunderTower':
        return new ThunderTower(pos, room);
      case 'TankTower':
        return new TankTower(pos, room);
      case 'StrongTower':
        return new StrongTower(pos, room);
      case 'IceTower':
        return new IceTower(pos, room);
      case 'BuffTower':
        return new BuffTower(pos, room);
      default:
        throw new Error(`Unknown prefabId: ${prefabId}`);
    }
  }
}
