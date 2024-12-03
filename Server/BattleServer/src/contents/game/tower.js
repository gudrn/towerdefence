import { assetManager } from '../../utils/assetManager.js';
import { GameObject } from './gameObject.js';

export class Tower extends GameObject {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  /**
   * @type {number} attackDamage
   * @type {number} attackRange
   * @type {number} attackCoolDown
   * @type {number} hp
   * @type {number} maxHp
   */
  attackDamage = 0; //추후에 projectile 클래스를 추가할 예정, 타워는 공격력이 없음
  attackRange = 0;
  attackCoolDown = 0;
  hp = 0;
  maxHp = 0;

  /**---------------------------------------------
   * [생성자]
   * @param {string} prefabId
   * @param {PosInfo} pos
   * @param {GameRoom} room
   */
  //---------------------------------------------
  constructor(prefabId, pos, room) {
    super(prefabId, pos, room);

    const towerData = assetManager.getTowerData(prefabId);
    if (towerData == null) {
      console.log('[Tower constructor] 유효하지 않은 prefabId');
      return;
    }

    this.attackDamage = towerData?.attackDamage;
    this.attackRange = towerData?.attackRange;
    this.attackCoolDown = towerData?.attackCoolDown;
    this.hp = this.maxHp = towerData?.maxHp;
    this.lastAttackTime = 0; // 마지막 공격 시간
    this.bullet = [];
  }

  /**
   * 타워가 공격할 몬스터를 선택
   * @param {Array} monsters - 몬스터 배열
   */
  getMonsterInRange(monsters) {
    let closestMonster = null;
    let minDistance = Infinity;

    for (const monster of monsters) {
      const distance =
        (this.pos.x - towerPos.x) * (this.pos.x - towerPos.x) +
        (this.pos.y - towerPos.y) * (this.pos.y - towerPos.y);

      if (distance <= this.attackRange && distance < minDistance) {
        minDistance = distance;
        closestMonster = monster;
      }
    }

    return closestMonster;
  }

  /**
   * 타워의 공격 처리
   * @param {Array} monsters - 몬스터 배열
   */
  attackTarget(monsters) {
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime < this.attackCoolDown) return;

    const target = this.getMonsterInRange(monsters);
    if (target) {
      // 투사체 생성
      const bullet = new Bullet(this.pos, target, 0.2, this.attackDamage);
      this.bullet.push(bullet);
      console.log('투사체 발사:', bullet);
    }

    this.lastAttackTime = currentTime;
  }

  /**
   * 투사체 이동 처리
   */
  updateBullet() {
    this.bullet = this.bullet.filter((bullet) => {
      bullet.move();
      return bullet.isActive;
    });
  }

  onDamaged(attackDamage) {
    this.hp = Math.max(this.hp - attackDamage, 0);
    if (this.hp > 0) this.onDeath();
  }

  onDeath() {
    throw new Error('Method not implemented.');
  }

  update() {}
}
