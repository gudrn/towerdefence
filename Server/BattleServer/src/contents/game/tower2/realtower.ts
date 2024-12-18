import { PosInfo } from 'src/protocol/struct_pb';
import { GameRoom } from 'src/contents/room/gameRoom';
import { assetManager } from 'src/utils/assetManager';
import { AssetTower } from 'src/utils/interfaces/assetTower';
import { GameObject } from '../gameObject';
import { create } from '@bufbuild/protobuf';
import { B2G_TowerAttackMonsterNotificationSchema } from 'src/protocol/tower_pb';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { B2G_MonsterHealthUpdateNotificationSchema } from 'src/protocol/monster_pb';
import { Monster } from '../monster';

export interface iMonsterDistance {
  monster: Monster;
  distance: number;
}

export abstract class RealTower extends GameObject {
  protected originalAttackDamage: number = 0;
  protected attackDamage: number = 0;
  protected attackRange: number = 0;
  public attackCoolDown: number = 0;
  public hp: number = 0;
  public maxHp: number = 0;
  protected bulletSpeed = 0;
  public target: null | undefined;
  public lastAttackTime: number = 0;
  protected isBuffed: boolean = false;
  private buffAmount: number = 0;
  protected explosionRadius: number = 0;

  constructor(towerData: AssetTower, pos: PosInfo, room: GameRoom) {
    super(towerData.prefabId, pos, room);
    if (towerData == null) {
      console.log('[RealTower constructor] 유효하지 않은 prefabId');
      return;
    }

    this.target = null;
    this.attackDamage = towerData.attackDamage;
    this.originalAttackDamage = this.attackDamage;
    this.attackRange = towerData.attackRange;
    this.attackCoolDown = towerData.attackCoolDown;
    this.hp = this.maxHp = towerData.maxHp;
    this.bulletSpeed = 15;
    this.lastAttackTime = 0;
    this.buffAmount = towerData.buffAmount ?? 0;
    this.explosionRadius = towerData.explosionRadius ?? 0;
  }

  public abstract splashDamage(target: Monster): void;

  public abstract processAttack(target: Monster): void;

  public abstract onDeath(): void;

  public abstract skill(): void;

  public abstract update(): void;

  attackTarget(targetData: iMonsterDistance) {
    this.lastAttackTime = Date.now();
    const { monster: target, distance } = targetData;
    if (!targetData) return;

    // 투사체 이동 시간 계산
    const travelTime = (distance / this.bulletSpeed) * 1000; // 이동 시간 (ms)

    // 총알 이동 효과 (애니메이션 대체)
    //console.log(`총알이 ${travelTime.toFixed(0)}ms 동안 날아감.`);

    const attackMotionPacket = create(B2G_TowerAttackMonsterNotificationSchema, {
      towerId: this.getId(),
      monsterPos: target.getPos(),
      travelTime: travelTime,
      roomId: this.room.id,
    });

    const attackMotionBuffer = PacketUtils.SerializePacket(
      attackMotionPacket,
      B2G_TowerAttackMonsterNotificationSchema,
      ePacketId.B2G_TowerAttackMonsterNotification,
      0,
    );
    this.room.broadcast(attackMotionBuffer);

    setTimeout(() => {
      // 타워 타입에 따른 공격 처리
      this.processAttack(target);

      // 2. 클라이언트에 공격 패킷 전송
      const attackPacket = create(B2G_MonsterHealthUpdateNotificationSchema, {
        monsterId: target.getId(),
        hp: target.hp,
        maxHp: target.maxHp,
        roomId: this.room.id,
      });

      //console.log('targetHp: ', target.hp);
      //console.log('targetMaxHp: ', target.maxHp);

      const attackBuffer = PacketUtils.SerializePacket(
        attackPacket,
        B2G_MonsterHealthUpdateNotificationSchema,
        ePacketId.B2G_MonsterHealthUpdateNotification,
        0,
      );
      this.room.broadcast(attackBuffer);
    }, travelTime); // 총알 이동 시간 이후 실행
  }

  protected findCloseMonster(monsters: Monster[]): iMonsterDistance | null {
    let ret: Monster;

    //공격 사거리의 제곱
    let adjustAttackRange = Math.pow(this.attackRange, 2);

    for (const monster of monsters) {
      // 거리 계산
      const distance =
        Math.pow(this.pos.x - monster.pos.x, 2) + Math.pow(this.pos.y - monster.pos.y, 2);

      // 범위 내에서 가장 가까운 몬스터 찾기
      if (distance <= adjustAttackRange && distance < minDistance) {
        minDistance = distance;
        closestMonster = monster;
      }
    }

    return closestMonster ? { monster: closestMonster, distance: minDistance } : null;
  }
}
