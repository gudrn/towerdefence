import { PosInfo } from 'src/protocol/struct_pb';
import { Tower } from './tower';
import { GameRoom } from 'src/contents/room/gameRoom';
import { B2G_MonsterHealthUpdateNotificationSchema } from 'src/protocol/monster_pb';
import { create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { assetManager } from 'src/utils/assetManager';
import { Monster } from '../monsters/monster';

export class MissileTower extends Tower {
  protected explosionRadius: number = 0; // 미사일 타워의 폭발 범위
  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('MissileTower');
    super(towerData, pos, room);
    this.explosionRadius = towerData.explosionRadius ?? 0;
  }

  protected override processAttack(target: Monster) {
    super.processAttack(target);
    this.splashDamage();
  }

  protected splashDamage() {
    if(this.target == null) {
      return;
    }

    // 범위 내 몬스터 찾기
    const monsters = Array.from(this.room.getMonsters().values());
    for (const monster of monsters) {
      // 주 타겟은 제외
      if (monster.getId() === this.target.monster.getId()) continue;

      // 거리 계산
      const distance =
        (this.target.monster.pos.x - monster.pos.x) * (this.target.monster.pos.x - monster.pos.x) +
        (this.target.monster.pos.y - monster.pos.y) * (this.target.monster.pos.y - monster.pos.y);

      // 폭발 범위 내에 있으면 데미지 처리
      if (distance <= this.explosionRadius * this.explosionRadius) {
        monster.onDamaged(this.getTotalDamage());

        const splashDamageAttackPacket = create(B2G_MonsterHealthUpdateNotificationSchema, {
          monsterId: monster.getId(),
          hp: monster.hp,
          roomId: this.room.id,
        });

        const splashDamageAttackBuffer = PacketUtils.SerializePacket(
          splashDamageAttackPacket,
          B2G_MonsterHealthUpdateNotificationSchema,
          ePacketId.B2G_MonsterHealthUpdateNotification,
          0,
        );
        this.room.broadcast(splashDamageAttackBuffer);
      }
    }
  }
}
