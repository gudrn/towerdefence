import { GameRoom } from 'src/contents/room/gameRoom';
import { Tower } from './tower';
import { MissileTower } from './missileTower';
import { ThunderTower } from './thunderTower';
import { TankTower } from './tankTower';
import { StrongTower } from './strongTower';
import { IceTower } from './iceTower';
import { PosInfo } from 'src/protocol/struct_pb';
import { BuffTower } from './buffTower';
import { BasicTower } from './basicTower';

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
