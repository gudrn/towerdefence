import { create } from '@bufbuild/protobuf';
import { PosInfo, TowerData } from 'src/protocol/struct_pb';
import { GameRoom } from '../../room/gameRoom';
import { assetManager } from 'src/utils/assetManager';
import { GameObject } from '../gameObject';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import {
  B2G_MonsterDeathNotificationSchema,
  B2G_MonsterHealthUpdateNotificationSchema,
} from 'src/protocol/monster_pb';
import { ePacketId } from 'ServerCore/network/packetId';
import {
  B2G_TowerAttackMonsterNotificationSchema,
  B2G_TowerBuffNotificationSchema,
} from 'src/protocol/tower_pb';
import { AssetTower } from 'src/utils/interfaces/assetTower';
import { OBJECT_STATE_TYPE } from 'src/protocol/enum_pb';
import { Monster } from '../monsters/monster';

export interface iMonsterDistance{
  monster: Monster,
  distance: number
};

export abstract class Tower extends GameObject {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  protected originalAttackDamage: number = 0; // 기본 공격력 (버프 적용 전)
  protected attackDamage: number = 0; // 현재 공격력 (버프 적용 후)
  protected attackRange: number = 0; // 공격 범위
  public attackCoolDown: number = 0; // 공격 쿨다운 시간
  public hp: number = 0; // 현재 체력
  public maxHp: number = 0; // 최대 체력
  protected bulletSpeed = 0; // 투사체 속도
  public target: null | undefined; // 현재 타겟
  public lastAttackTime: number = 0; // 마지막 공격 시간
  protected isBuffed: boolean = false; // 버프 유무

  // 특수 능력치들
  private buffAmount: number = 0;
  protected explosionRadius: number = 0; // 미사일 타워의 폭발 범위
  /*---------------------------------------------
    [생성자]
---------------------------------------------*/
  constructor(towerData: AssetTower, pos: PosInfo, room: GameRoom) {
    super(towerData.prefabId, pos, room);

    if (towerData == null) {
      console.log('[Tower constructor] 유효하지 않은 prefabId');
      return;
    }

    this.target = null; // 타겟
    // 기본 스탯 초기화
    this.attackDamage = towerData.attackDamage;
    this.originalAttackDamage = this.attackDamage;
    this.attackRange = towerData.attackRange;
    this.attackCoolDown = towerData.attackCoolDown;
    this.hp = this.maxHp = towerData.maxHp;
    this.bulletSpeed = 15;
    this.lastAttackTime = 0;

    // 특수 능력치 초기화 (?? 연산자로 기본값 0 설정)
    this.buffAmount = towerData.buffAmount ?? 0;
    this.explosionRadius = towerData.explosionRadius ?? 0; // 미사일 타워
  }

  /*---------------------------------------------
      [Update]
  ---------------------------------------------*/
  public update() {
    switch (this.state) {
    case OBJECT_STATE_TYPE.IDLE:
        this.updateIdle();
        break;
    case OBJECT_STATE_TYPE.SKILL:
        this.updateSkill();
        break;
    }
  }

  /*---------------------------------------------
      [updateIdle]
      - 공격 가능한 몬스터 찾기
  ---------------------------------------------*/
  private updateIdle() {

  }

  /*---------------------------------------------
      [updateSkill]
      - 공격하기
  ---------------------------------------------*/
  private updateSkill(){
    this.lastAttackTime = Date.now();
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
        hp: target.getHp(),
        maxHp: target.getMaxHp(),
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

  /*---------------------------------------------
      [findCloseMonster]
      - 공격 범위 내의 가장 가까운 몬스터를 찾습니다

      - get으로 시작하는 메소드는 복잡도가 O(1)이어야 합니다.
      - 그렇지 않으면 find...등의 접두사를 사용하는 게 좋습니다
  ---------------------------------------------*/
  protected findCloseMonster(monsters: Monster[]): iMonsterDistance | null {
    let ret: Monster

    //공격 사거리의 제곱
    let adjustAttackRange = Math.pow(this.attackRange, 2);

    for (const monster of monsters) {
      // 거리 계산
      const distance = Math.pow(this.pos.x - monster.pos.x, 2) + Math.pow(this.pos.y - monster.pos.y, 2);

      // 범위 내에서 가장 가까운 몬스터 찾기
      if (distance <= adjustAttackRange && distance < minDistance) {
        minDistance = distance;
        closestMonster = monster;
      }
    }

    return closestMonster ? { monster: closestMonster, distance: minDistance } : null;
  }

  /**
   * 타워 공격
   * @param {object} monsters - 몬스터 객체 { id, x, y }
   */

  /**
   * 타워의 공격 처리
   * @param targetData 타겟 몬스터와 거리 정보
   */
  protected attackTarget(targetData: iMonsterDistance) {
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
  /*-----
      [splashDamage]
      - 타워의 특수 능력치 처리
  */
  public abstract splashDamage(target: Monster): void;
  /*---------------------------------------------
      [onDamaged]
      - 타워가 공격당했을 때 처리
  ---------------------------------------------*/
  public override onDamaged(amount: number): boolean {
    this.hp = Math.max(this.hp - amount, 0);
    if (this.hp <= 0) {
      this.onDeath();
      return true; // 타워 hp가 0보다 작다면 onDeath 수행
    }
    return false; // 타워 hp가 0보다 크다면 공격 수행
  }

  /**---------------------------------------------
   [onDeath]
    타워가 파괴되면 게임에서 제거
   ---------------------------------------------*/
  protected override onDeath() {
    this.room.removeObject(this.getId());
  }

  /*---------------------------------------------
      [getter]
  ---------------------------------------------*/
  getAttackRange(): number {
    return this.attackRange;
  }
  getAttackDamage(): number {
    return this.attackDamage;
  }
  getIsBuffed(): boolean {
    return this.isBuffed;
  }

