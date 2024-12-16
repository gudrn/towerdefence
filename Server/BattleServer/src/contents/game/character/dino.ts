import { eCharacterId } from 'ServerCore/utils/characterId';
import { GameRoom } from '../../room/gameRoom';
import { Character } from './character';
import { GamePlayer } from '../gamePlayer';

/**
 * 개별 캐릭터 클래스 정의
 */
export class Dino extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.dino, room, player); // 3초 쿨다운
  }

  protected override activateAbility(): void {
    console.log('Dino 고유 능력');
    // 구체적인 스킬 로직 구현
  }
}
