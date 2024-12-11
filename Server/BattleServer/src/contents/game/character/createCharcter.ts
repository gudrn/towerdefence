import { GameRoom } from 'src/contents/room/gameRoom.js';
import { Character } from './character.js';
import { eCharacterId } from 'ServerCore/utils/characterId.js';
import { Red } from './red.js';
import { Shark } from './shark.js';
import { Malang } from './malang.js';
import { Frog } from './frog.js';
import { BombMan } from './bombMan.js';
import { SlowMan } from './slowMan.js';
import { MaskMan } from './maskMan.js';
import { Dino } from './dino.js';
import { GamePlayer } from '../gamePlayer.js';

/**
 * 캐릭터 등록
 */
export class CreateCharacter {
  static createChar(prefabId: string, room: GameRoom, player: GamePlayer): Character {
    switch (prefabId) {
      case eCharacterId.red:
        return new Red(room, player);
      case eCharacterId.shark:
        return new Shark(room, player);
      case eCharacterId.Malang:
        return new Malang(room, player);
      case eCharacterId.frog:
        return new Frog(room, player);
      case eCharacterId.bombman:
        return new BombMan(room, player);
      case eCharacterId.slowman:
        return new SlowMan(room, player);
      case eCharacterId.maskman:
        return new MaskMan(room, player);
      case eCharacterId.dino:
        return new Dino(room, player);
      default:
        throw new Error(`Unknown prefabId: ${prefabId}`);
    }
  }
}
