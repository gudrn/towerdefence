import { GameRoom } from 'src/contents/room/gameRoom';
import { Character } from './character';
import { eCharacterId } from 'ServerCore/utils/characterId';
import { GamePlayer } from '../gamePlayer';

export class MaskMan extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.maskman, room, player); // 3초 쿨다운
  }

  protected override activateAbility(): void {
    console.log('MaskMan 고유 능력');
    // 구체적인 스킬 로직 구현
  }
}
