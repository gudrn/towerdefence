import { PosInfo } from 'src/protocol/struct_pb';
import { GameRoom } from '../room/gameRoom';
import { assetManager } from 'src/utils/assetManager';
import { GameObject } from './gameObject';
import {
  createTowerAttackMotionPacket,
  createTowerAttackNotificationPacket,
  createTowerBuffNotificationPacket,
} from 'src/packet/towerPacket';
import { createDeathMoster } from 'src/packet/gameRoomPacket';
import { SkillUseMonster } from './skillUseMonster';

export class Tower extends GameObject {
  /*---------------------------------------------
    [멤버 변수]
  ---------------------------------------------*/
  private originalAttackDamage: number = 0;  // 원래 공격력 (버프 적용 전)
  private attackDamage: number = 0;          // 현재 공격력 (버프 적용 후)
  private attackRange: number = 0;           // 공격 범위
  private attackCoolDown: number = 0;        // 공격 쿨다운 시간 
  public hp: number = 0;                     // 현재 체력
  public maxHp: number = 0;                  // 최대 체력
  private bulletSpeed = 0;                   // 투사체 속도 
  public target: null | undefined;           // 현재 타겟 
  public lastAttackTime: number = 0;         // 마지막 공격 시간
  private buffedBy: Set<string> = new Set(); // 버프를 받은 타워들의 ID 목록

  /**
   * 타워 생성자
   * @param prefabId 타워 프리팹 ID
   * @param pos 타워 위치
   * @param room 게임룸 인스턴스
   */
  constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
    super(prefabId, pos, room);

    const towerData = assetManager.getTowerData(prefabId);
    if (towerData == null) {
      console.log('[Tower constructor] 유효하지 않은 prefabId');
      return;
    }

    this.target = null; // 타겟
    this.attackDamage = towerData?.attackDamage;
    this.originalAttackDamage = this.attackDamage;
    this.attackRange = towerData?.attackRange;
    this.attackCoolDown = towerData?.attackCoolDown;
    this.hp = this.maxHp = towerData?.maxHp;
    this.bulletSpeed = 15; // 총알 속도 (픽셀/초)
    this.lastAttackTime = 0; // 마지막 공격 시간

    if (prefabId === 'BuffTower') {
      // 버프 타워인 경우, 주변 타워들에게 버프 적용
      const towersInRange = this.getTowersInRange(Array.from(this.room.getTowers().values()));
      towersInRange.forEach((tower) => {
        tower.increaseAttackDamage(this.getId());
      });
    } else {
      // 일반 타워인 경우, 주변 버프 타워에게서 버프 받기
      const buffTowers = Array.from(this.room.getTowers().values()).filter(
        (t) => t.getPrefabId() === 'BuffTower',
      );

      buffTowers.forEach((buffTower) => {
        const inRangeTowers = buffTower.getTowersInRange([this]);
        if (inRangeTowers.length > 0) {
          this.increaseAttackDamage(buffTower.getId());
        }
      });
    }
  }

  /**
   * 공격 가능한 가장 가까운 몬스터를 찾음
   * @param monsters 현재 존재하는 몬스터 배열
   * @returns 가장 가까운 몬스터와 그 거리, 없으면 null
   */
  private getMonsterInRange(
    monsters: SkillUseMonster[],
  ): { monster: SkillUseMonster; distance: number } | null {
    let closestMonster: SkillUseMonster | null = null;
    let minDistance = Infinity;

    for (const monster of monsters) {
      const distance = Math.sqrt(
        Math.pow(this.pos.x - monster.pos.x, 2) + Math.pow(this.pos.y - monster.pos.y, 2),
      );

      if (distance <= this.attackRange && distance < minDistance) {
        minDistance = distance;
        closestMonster = monster;
      }
    }

    return closestMonster ? { monster: closestMonster, distance: minDistance } : null;
  }

  /**
   * 타워가 공격
   * @param targetData 타겟 몬스터와 거리 정보
   */

  private attackTarget(targetData: { monster: SkillUseMonster; distance: number }) {
    this.lastAttackTime = Date.now();
    const { monster: target, distance } = targetData;
    if (!targetData) return; // 공격 가능한 대상이 없으면 종료

    const travelTime = (distance / this.bulletSpeed) * 1000;

    // 공격 모션 패킷 전송
    const attackMotionBuffer = createTowerAttackMotionPacket(
      this.getId(),
      target.getPos(),
      travelTime,
    );
    this.room.broadcast(attackMotionBuffer);

    setTimeout(() => {
      const isDestroyed = target.onDamaged(this.attackDamage);

      if (this.getPrefabId() === 'IceTower') {
        target.applySlowEffect(3000);
      }

      const attackBuffer = createTowerAttackNotificationPacket(
        target.getId(),
        target.hp,
        target.maxHp,
      );
      this.room.broadcast(attackBuffer);

      if (isDestroyed) {
        const monsterScore = target.score;
        this.room.addScore(monsterScore);
        const monsterDeathBuffer = createDeathMoster(target.getId(), target.score);
        this.room.broadcast(monsterDeathBuffer);
      }
    }, travelTime);
  }
  /**---------------------------------------------
     * [버프 타워 범위 내 타워 찾기]
     * @param {Tower[]} towers - 전체 타워 배열
     * @returns {Tower[]} - 범위 내 타워 배열
     ---------------------------------------------*/
  getTowersInRange(towers: Tower[]): Tower[] {
    // 범위 내 타워 배열 생성
    const towersInRange: Tower[] = [];

    // 모든 타워를 순회하면서 검사하고
    for (const tower of towers) {
      // 본인은 제외
      if (tower.getId() === this.getId()) continue;

      // 타워 간 거리 계산
      const distance =
        (this.pos.x - tower.pos.x) * (this.pos.x - tower.pos.x) +
        (this.pos.y - tower.pos.y) * (this.pos.y - tower.pos.y);

      // 범위 내에 있으면 배열에 추가
      if (distance <= this.attackRange * this.attackRange) {
        towersInRange.push(tower);
      }
    }

    return towersInRange;
  }

  /**---------------------------------------------
   * [공격력 버프 적용]
   * @param buffTowerId 버프를 주는 타워의 ID
  ---------------------------------------------*/
  increaseAttackDamage(buffTowerId: string) {
    if (this.buffedBy.size > 0) return; // 버프 중복 방지

    // 버프가 없을 때만 새로운 버프 적용
    this.buffedBy.add(buffTowerId);
    this.attackDamage = this.originalAttackDamage + this.buffedBy.size * 5;

    console.log(`${this.getPrefabId()}: ${this.originalAttackDamage} -> ${this.attackDamage}`);
    // 버프 적용 패킷 전송
    const buffApplyPacket = createTowerBuffNotificationPacket(this.getId(), true); // 버프 적용
    this.room.broadcast(buffApplyPacket);
  }
  /**---------------------------------------------
   * [공격력 버프 해제]
   * @param buffTowerId 제거할 버프 타워의 ID
  ---------------------------------------------*/
  removeBuffFromTower(buffTowerId: string) {
    if (this.buffedBy.has(buffTowerId)) {
      this.buffedBy.delete(buffTowerId);

      this.attackDamage = this.originalAttackDamage;

      // 버프 해제 패킷 전송
      const buffRemovePacket = createTowerBuffNotificationPacket(this.getId(), false); // 버프 해제
      this.room.broadcast(buffRemovePacket);
    }
  }
  /**---------------------------------------------
   * [버프 타워 파괴 시 주변타워 해당 버프 제거]
   ---------------------------------------------*/
   removeAllBuffsFromTower() {
    if (this.getPrefabId() === 'BuffTower') {
      // 현재 버프 타워의 범위 내에 있는 타워들만 버프 해제
      const towersInRange = this.getTowersInRange(Array.from(this.room.getTowers().values()));
      towersInRange.forEach((tower) => {
        tower.removeBuffFromTower(this.getId());
      });
    }
  }

  /*---------------------------------------------
    [타워가 데미지 받을 시 처리]
   * @param {number} attackDamage - 가하는 데미지
   * @return {boolean} - 몬스터 사망 여부
  ---------------------------------------------*/
  onDamaged(attackDamage: number): boolean {
    this.hp = Math.max(this.hp - attackDamage, 0);
    if (this.hp <= 0) {
      this.onDeath();
      return true; // 타워 hp가 0보다 작다면 onDeath 수행
    }
    return false; // 타워 hp가 0보다 크다면 공격 수행
  }

  /*---------------------------------------------
    [타워 파괴 시 처리]
  ---------------------------------------------*/
  onDeath() {
    if (this.getPrefabId() === 'BuffTower') {
      this.removeAllBuffsFromTower(); // 버프 타워 파괴시 버프 해제
    }
    this.room.removeObject(this.getId());
  }
  
  /*---------------------------------------------
    [타워 업데이트]
  ---------------------------------------------*/
  update() {
    // 타워가 파괴되었다면 업데이트 하지 않음
    if (this.hp <= 0) return;

    // 공격 쿨다운 체크
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime > this.attackCoolDown) {
      const monsters = Array.from(this.room.getMonsters().values());
      const targetData = this.getMonsterInRange(monsters);
      if (targetData) {
        this.attackTarget(targetData); 
      }
    }
  }
}
