import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { assetManager } from '../../utils/assetManager.js';
import { GameObject } from './gameObject.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { B2C_TowerAttackMonsterNotificationSchema } from '../../protocol/tower_pb.js';
import { B2C_MonsterDeathNotificationSchema } from '../../protocol/monster_pb.js';

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
  attackDamage = 0;
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
   * 타워 공격
   * @param {object} tower - 타워 객체 { id, x, y }
   */

  attackTarget(monsters) {
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime > this.attackCoolDown) {
      this.lastAttackTime = currentTime;

      const target = this.getMonsterInRange(monsters);

      // 몬스터 데미지 처리
      const isDestroyed = target.onDamaged(this.attackDamage);

      // 2. 클라이언트에 공격 패킷 전송
      const attackPacket = create(B2C_TowerAttackMonsterNotificationSchema, {
        towerId: this.getId(),
        posInfo: target.getpos(),
        hp: target.hp,
        maxHp: target.maxHp,
      });

      const attackBuffer = PacketUtils.SerializePacket(
        attackPacket,
        B2C_TowerAttackMonsterNotificationSchema,
        ePacketId.B2C_TowerAttackMonsterNotification,
        0,
      );
      this.room.broadcast(attackBuffer);

      // 3. 타워 파괴 처리
      if (isDestroyed) {
        console.log(`타워 ${target.id}가 파괴되었습니다.`);
        this.room.removeObject(target.id); // GameRoom에서 타워 제거

        const mopnsterDeathPacket = create(B2C_MonsterDeathNotificationSchema, {
          monsterId: target.id,
        });

        const monsterDeathBuffer = PacketUtils.SerializePacket(
          mopnsterDeathPacket,
          B2C_MonsterDeathNotificationSchema,
          ePacketId.B2C_MonsterDeathNotification,
          0, //수정 부분
        );

        this.room.broadcast(monsterDeathBuffer);
      }
    }
  }

  /**
   *
   * @param {number} attackDamage
   */
  onDamaged(attackDamage) {
    this.hp = Math.max(this.hp - attackDamage, 0);
    if (this.hp > 0) this.onDeath();
  }

  onDeath() {
    throw new Error('Method not implemented.');
  }

  update() {}
}
