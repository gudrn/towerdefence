import { eCharacterId } from 'ServerCore/utils/characterId';
import { GameRoom } from '../../room/gameRoom';
import { Character } from './character';
import { GamePlayer } from '../gamePlayer';

/**
 * 개별 캐릭터 클래스 정의
 */
export class Red extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.red, room, player); // 3초 쿨다운
  }

  protected override activateAbility(): void {
    // 현재 캐릭터에 연결된 플레이어를 가져옵니다.
    const player: GamePlayer | undefined = this.player;
    if (!player) {
      console.log('플레이어가 없습니다.');
      return;
    }

    console.log('Red의 고유 능력 카드 추가');
    player.addRandomCard();
  }
}
