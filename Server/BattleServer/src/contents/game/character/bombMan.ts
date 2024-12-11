import { eCharacterId } from 'ServerCore/utils/characterId.js';
import { GameRoom } from '../../room/gameRoom.js';
import { Character } from './character.js';
import { GamePlayer } from '../gamePlayer.js';

/**
 * 개별 캐릭터 클래스 정의
 */
export class BombMan extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.bombman, 3, room, player); // 3초 쿨다운
  }

  protected activateAbility() {
    console.log('BombMan 고유 능력');
    // 구체적인 스킬 로직 구현
  }
}
