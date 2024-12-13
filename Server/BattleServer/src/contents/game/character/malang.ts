import { GameRoom } from 'src/contents/room/gameRoom';
import { Character } from './character';
import { eCharacterId } from 'ServerCore/utils/characterId';
import { GamePlayer } from '../gamePlayer';
import { Tower } from '../tower';
import { createTowerBuffNotificationPacket } from 'src/packet/towerPacket';

export class Malang extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.Malang, room, player); // 4초 쿨다운
  }

  protected override activateAbility(): void {
    // 현재 캐릭터에 연결된 플레이어를 가져옵니다.
    const player: GamePlayer | undefined = this.player;
    if (!player) {
      console.log('플레이어가 없습니다.');
      return;
    }

    console.log('Malang의 고유 능력 발동: 원형 범위 내 타워 공격력 증가');

    const range = 5; // 버프 적용 범위 (단위: 거리)

    const towers = this.getTowersInRange(this.room, player, range);

    const attackCoolDownBuff = 0.1; // 버프할 공격속도 값
    const buffDuration = 3 * 1000; // 버프 지속 시간 (밀리초)

    const towersToBuff = towers.map((tower) => {
      const currentAttackCoolDown = tower.attackCoolDown; // 원래 공격속도 저장
      const buffAmount = tower.attackCoolDown * attackCoolDownBuff; // 공격속도 증가수치

      tower.attackCoolDown -= buffAmount; // 공격속도 증가
      console.log(`${tower.prefabId} 타워 공격속도가 ${attackCoolDownBuff} 증가했습니다.`);

      return {
        tower,
        buffAmount,
        currentAttackCoolDown,
      };
    });

    this.towerBuff(
      towersToBuff.map((entry) => entry.tower),
      'asBuff',
      true,
    );

    setTimeout(() => {
      towersToBuff.forEach(({ tower, currentAttackCoolDown }) => {
        tower.attackCoolDown = currentAttackCoolDown;
        console.log(`${tower.prefabId} 타워 공격력이 복원되었습니다.`);
      });

      this.towerBuff(
        towersToBuff.map((entry) => entry.tower),
        'asBuff',
        false,
      );
    }, buffDuration);
  }

  /**
   * 버프 알림을 전송하는 메서드
   * @param tower 버프를 적용받은 타워
   * @param buffType 증가된 공격속도
   * @param isBuffActive 버프 적용 여부 (true: 적용, false: 해제)
   */
  private towerBuff(tower: Tower[], buffType: string, isBuffActive: boolean) {
    const towerBuffNotificationBuffer = createTowerBuffNotificationPacket(
      tower,
      buffType,
      isBuffActive,
    );
    this.room.broadcast(towerBuffNotificationBuffer);
  }
}
