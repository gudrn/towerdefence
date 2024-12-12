import { PosInfo } from 'src/protocol/struct_pb';
import { GameRoom } from '../room/gameRoom';
import { assetManager } from 'src/utils/assetManager';
import { GameObject } from './gameObject';
import { Monster } from './monster';
import {
  createTowerAttackMotionPacket,
  createTowerAttackNotificationPacket,
  createTowerBuffNotificationPacket,
} from 'src/packet/towerPacket';
import { createDeathMoster } from 'src/packet/gameRoomPacket';

export class Tower extends GameObject {
  /*---------------------------------------------
    [멤버 변수]
  ---------------------------------------------*/
  private originalAttackDamage: number = 0;
  private attackDamage: number = 0;
  private attackRange: number = 0;
  private attackCoolDown: number = 0;
  public hp: number = 0;
  public maxHp: number = 0;
  private bulletSpeed = 0;
  public target: null | undefined;
  public lastAttackTime: number = 0;
  private buffedBy: Set<string> = new Set();

  /*---------------------------------------------
    [생성자]
  ---------------------------------------------*/
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
  }

  /**
   * 타워가 공격할 몬스터를 선택
   * @param {Array} monsters - 몬스터 배열
   */
  private getMonsterInRange(monsters: Monster[]): { monster: Monster; distance: number } | null {
    let closestMonster: Monster | null = null;
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
   * 타워 공격
   * @param {object} monsters - 몬스터 객체 { id, x, y }
   */

  attackTarget(monsters: Monster[]) {
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime > this.attackCoolDown) {
      this.lastAttackTime = currentTime;

      const targetData = this.getMonsterInRange(monsters);

      if (!targetData) return; // 공격 가능한 대상이 없으면 종료

      const { monster: target, distance } = targetData;

      const travelTime = (distance / this.bulletSpeed) * 1000; // 이동 시간 (ms)

      // 총알 이동 효과 (애니메이션 대체)
      //console.log(`총알이 ${travelTime.toFixed(0)}ms 동안 날아감.`);

      const attackMotionBuffer = createTowerAttackMotionPacket(
        this.getId(),
        target.getPos(),
        travelTime,
      );
      this.room.broadcast(attackMotionBuffer);

      setTimeout(() => {
        // 총알이 도착한 시점에 데미지 처리
        const isDestroyed = target.onDamaged(this.attackDamage);

        // 2. 클라이언트에 공격 패킷 전송
        const attackBuffer = createTowerAttackNotificationPacket(
          target.getId(),
          target.hp,
          target.maxHp,
        );

        console.log('targetHp: ', target.hp);
        console.log('targetMaxHp: ', target.maxHp);

        this.room.broadcast(attackBuffer);

        // 3. 몬스터 사망 처리
        if (isDestroyed) {
          const monsterScore = target.score;

          // 점수를 GameRoom에 추가
          this.room.addScore(monsterScore);
          const monsterDeathBuffer = createDeathMoster(target.getId(), target.score);
          this.room.broadcast(monsterDeathBuffer);
        }
      }, travelTime); // 총알 이동 시간 이후 실행
    }
  }
  /**---------------------------------------------
     * [범위 내 타워 찾기]
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
      const distance = Math.sqrt(
        Math.pow(this.pos.x - tower.pos.x, 2) + Math.pow(this.pos.y - tower.pos.y, 2),
      );

      // 범위 내에 있으면 배열에 추가
      if (distance <= this.attackRange) {
        towersInRange.push(tower);
      }
    }

    return towersInRange;
  }

  /**---------------------------------------------
   * [공격력 증가]
   ---------------------------------------------*/
  increaseAttackDamage(buffTowerId: string) {
    // 해당 버프가 없을 때만 버프 목록에 해당 버프타워 ID 추가
    if (!this.buffedBy.has(buffTowerId)) {
      this.buffedBy.add(buffTowerId);

      // 버프량
      this.attackDamage = this.originalAttackDamage + this.buffedBy.size * 5;

      // 버프 적용 패킷 전송
      const buffApplyPacket = createTowerBuffNotificationPacket(this.getId(), true); // 버프 적용
      this.room.broadcast(buffApplyPacket);
    }
  }
  /**---------------------------------------------
   * [버프 해제]
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
   * [모든 타워에서 해당 버프 제거]
   ---------------------------------------------*/
  removeAllBuffsFromTower() {
    if (this.getPrefabId() === 'BuffTower') {
      Array.from(this.room.getTowers().values()).forEach((tower) => {
        tower.removeBuffFromTower(this.getId());
      });
    }
  }

  /*---------------------------------------------
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

  onDeath() {
    if (this.getPrefabId() === 'BuffTower') {
      this.removeAllBuffsFromTower(); // 버프 타워 파괴시 버프 해제
    }
    this.room.removeObject(this.getId());
  }

  update() {}
}
