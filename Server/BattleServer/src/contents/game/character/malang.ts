import { GameRoom } from 'src/contents/room/gameRoom';
import { Character } from './character';
import { eCharacterId } from 'ServerCore/utils/characterId';
import { GamePlayer } from '../gamePlayer';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { B2G_TowerBuffNotificationSchema } from 'src/protocol/tower_pb';
import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { Tower } from '../towers/tower';
import { assetManager } from 'src/utils/assetManager';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';

export class Malang extends Character {
  private range: number;
  private buffDuration: number;
  private attackCoolDownBuff: number;

  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.Malang, room, player); // 4초 쿨다운
    const skillData = assetManager.getCharacterData('Malang');
    if (skillData == null) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, '데이터를 불러오지 못했습니다.');
    }
    this.range = skillData.range;
    this.buffDuration = skillData.buffDuration;
    this.attackCoolDownBuff = skillData.attackCoolDownBuff;
  }

  protected override activateAbility(): void {
    // 현재 캐릭터에 연결된 플레이어를 가져옵니다.
    const player: GamePlayer | undefined = this.player;
    if (!player) {
      console.log('플레이어가 없습니다.');
      return;
    }

    console.log('Malang의 고유 능력 발동: 원형 범위 내 타워 공격력 증가');

    const towers = this.getTowersInRange(this.room, player, this.range);

    const towersToBuff = towers.map((tower) => {
      const currentAttackCoolDown = tower.attackCoolDown; // 원래 공격속도 저장
      const buffAmount = tower.attackCoolDown * this.attackCoolDownBuff; // 공격속도 증가수치

      tower.attackCoolDown -= buffAmount; // 공격속도 증가
      console.log(
        `${tower.getPrefabId()} 타워 공격속도가 ${this.attackCoolDownBuff} 증가했습니다.`,
      );

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
        console.log(`${tower.getPrefabId()} 타워 공격력이 복원되었습니다.`);
      });

      this.towerBuff(
        towersToBuff.map((entry) => entry.tower),
        'asBuff',
        false,
      );
    }, this.buffDuration);
  }

  /**
   * 버프 알림을 전송하는 메서드
   * @param tower 버프를 적용받은 타워
   * @param buffType 증가된 공격속도
   * @param isBuffActive 버프 적용 여부 (true: 적용, false: 해제)
   */
  private towerBuff(towers: Tower[], buffType: string, isBuffActive: boolean) {
    const notificationPacket = create(B2G_TowerBuffNotificationSchema, {
      towerId: towers.map((tower) => tower.getId()),
      buffType: buffType,
      isBuffed: isBuffActive,
      roomId: this.room.id,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      notificationPacket,
      B2G_TowerBuffNotificationSchema,
      ePacketId.B2G_TowerBuffNotification,
      0,
    );
    this.room.broadcast(sendBuffer);
  }
}
