import { GameRoom } from 'src/contents/room/gameRoom';
import { Character } from './character';
import { eCharacterId } from 'ServerCore/utils/characterId';
import { Red } from './red';
import { Shark } from './shark';
import { Malang } from './malang';
import { Frog } from './frog';
import { BombMan } from './bombMan';
import { SlowMan } from './slowMan';
import { MaskMan } from './maskMan';
import { Dino } from './dino';
import { GamePlayer } from '../gamePlayer';

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
