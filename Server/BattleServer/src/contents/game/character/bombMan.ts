import { eCharacterId } from 'ServerCore/utils/characterId';
import { GameRoom } from '../../room/gameRoom';
import { Character } from './character';
import { GamePlayer } from '../gamePlayer';

/**
 * 개별 캐릭터 클래스 정의
 */
export class BombMan extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.bombman, room, player); // 3초 쿨다운
  }

  protected override activateAbility(): void {
    //고유 로직
  }
}
