import { PosInfo } from 'src/protocol/struct_pb';
import { Tower } from './tower';
import { GameRoom } from 'src/contents/room/gameRoom';
import { assetManager } from 'src/utils/assetManager';

export class StrongTower extends Tower {
  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('StrongTower');
    super(towerData, pos, room);
  }
}
