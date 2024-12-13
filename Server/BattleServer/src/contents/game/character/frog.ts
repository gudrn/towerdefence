import { eCharacterId } from 'ServerCore/utils/characterId';
import { GameRoom } from '../../room/gameRoom';
import { Character } from './character';
import { GamePlayer } from '../gamePlayer';
import { createTowerHealNotificationPacket } from 'src/packet/towerPacket';
import { gameRoomManager } from 'src/contents/room/gameRoomManager';

/**
 * 개별 캐릭터 클래스 정의
 */
export class Frog extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.frog, room, player); // 3초 쿨다운
  }

  protected override activateAbility(): void {
    // 현재 캐릭터에 연결된 플레이어를 가져옵니다.
    const player: GamePlayer | undefined = this.player;
    if (!player) {
      console.log('플레이어가 없습니다.');
      return;
    }

    console.log('frog의 고유 능력 발동: 원형 범위 내 타워 체력 회복');

    const range = 5; // 버프 적용 범위 (단위: 거리)
    const heal = 20; // 회복할 체력 값

    if (this.room == undefined) {
      return;
    }
    const towers = this.getTowersInRange(this.room, player, range);

    //?? 머지 외안되
    towers.forEach((tower) => {
      tower.hp = Math.min(tower.hp + heal, tower.maxHp); // 공격력 증가
      console.log(`${tower.prefabId} 타워 체력을 ${heal} 회복했습니다.`);
      const towerId = tower.getId();
      const towerBuffer = createTowerHealNotificationPacket(towerId, tower);
      if (this.room != undefined) this.room.broadcast(towerBuffer);
    });
  }
}
