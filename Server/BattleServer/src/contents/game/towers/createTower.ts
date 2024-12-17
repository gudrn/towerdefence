import { GameRoom } from 'src/contents/room/gameRoom';
import { Tower } from './tower';
import { MissileTower } from './MissileTower';
import { ThunderTower } from './ThunderTower';
import { TankTower } from './TankTower';
import { StrongTower } from './StrongTower';
import { IceTower } from './IceTower';
import { PosInfo } from 'src/protocol/struct_pb';
import { BuffTower } from './buffTower';
import { BasicTower } from './BasicTower';

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
