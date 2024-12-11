import { GameRoom } from 'src/contents/room/gameRoom.js';
import { Character } from './character.js';
import { eCharacterId } from 'ServerCore/utils/characterId.js';
import { GamePlayer } from '../gamePlayer.js';

export class MaskMan extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.maskman, 3, room, player); // 3초 쿨다운
  }

  protected activateAbility() {
    console.log('MaskMan 고유 능력');
    // 구체적인 스킬 로직 구현
  }
}
