import { PosInfo } from 'src/protocol/struct_pb';
import { Tower } from './tower';
import { GameRoom } from 'src/contents/room/gameRoom';
import { SkillUseMonster } from '../skillUseMonster';
import { B2G_MonsterHealthUpdateNotificationSchema } from 'src/protocol/monster_pb';
import { create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { assetManager } from 'src/utils/assetManager';

export class MissileTower extends Tower {
  protected explosionRadius: number = 0; // 미사일 타워의 폭발 범위
  constructor(pos: PosInfo, room: GameRoom) {
    const towerData = assetManager.getTowerData('MissileTower');
    super(towerData, pos, room);
    this.explosionRadius = towerData.explosionRadius ?? 0;
  }

  protected processAttack(target: SkillUseMonster) {
    target.onDamaged(this.attackDamage);
    this.splashDamage(target);
  }

  override splashDamage(target: SkillUseMonster) {
    // 범위 내 몬스터 찾기
    const monsters = Array.from(this.room.getMonsters().values());
    for (const monster of monsters) {
      // 주 타겟은 제외
      if (monster.getId() === target.getId()) continue;

      // 거리 계산
      const distance =
        (target.pos.x - monster.pos.x) * (target.pos.x - monster.pos.x) +
        (target.pos.y - monster.pos.y) * (target.pos.y - monster.pos.y);

      // 폭발 범위 내에 있으면 데미지 처리
      if (distance <= this.explosionRadius * this.explosionRadius) {
        monster.onDamaged(this.attackDamage);

        const splashDamageAttackPacket = create(B2G_MonsterHealthUpdateNotificationSchema, {
          monsterId: target.getId(),
          hp: target.hp,
          maxHp: target.maxHp,
          roomId: this.room.id,
        });

        //console.log('targetHp: ', target.hp);
        //console.log('targetMaxHp: ', target.maxHp);

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
