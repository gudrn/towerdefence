import { GameRoom } from 'src/contents/room/gameRoom';
import { PosInfo } from 'src/protocol/struct_pb';
import { Tower } from './tower';
import { assetManager } from 'src/utils/assetManager';

export class IceTower extends Tower {
  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('IceTower');
    super(towerData, pos, room);
  }
}
