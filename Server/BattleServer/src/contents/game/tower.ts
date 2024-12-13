import { create } from '@bufbuild/protobuf';
import { PosInfo } from "src/protocol/struct_pb";
import { GameRoom } from "../room/gameRoom";
import { assetManager } from "src/utils/assetManager";
import { GameObject } from "./gameObject";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { B2C_MonsterDeathNotificationSchema, B2C_MonsterHealthUpdateNotificationSchema } from "src/protocol/monster_pb";
import { ePacketId } from "ServerCore/network/packetId";
import { B2C_TowerAttackMonsterNotificationSchema } from 'src/protocol/tower_pb';
import { Monster } from './monster';



export class Tower extends GameObject {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  private attackDamage: number = 0;
  private attackRange: number = 0;
  private attackCoolDown: number = 0;
  public hp: number = 0;
  public maxHp: number = 0;
  private bulletSpeed = 0;
  public target: null | undefined;
  public lastAttackTime: number = 0;

/*---------------------------------------------
    [생성자]
---------------------------------------------*/
  constructor(prefabId: string, pos: PosInfo, room: GameRoom){
    super(prefabId, pos, room);

    const towerData = assetManager.getTowerData(prefabId);
    if (towerData == null) {
      console.log('[Tower constructor] 유효하지 않은 prefabId');
      return;
    }

    this.target = null; // 타겟
    this.attackDamage = towerData?.attackDamage;
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
    // const currentTime = Date.now();
    // if (currentTime - this.lastAttackTime > this.attackCoolDown) {
    //   this.lastAttackTime = currentTime;

    //   const targetData = this.getMonsterInRange(monsters);

    //   if (!targetData) return; // 공격 가능한 대상이 없으면 종료

    //   const { monster: target, distance } = targetData;

    //   const travelTime = (distance / this.bulletSpeed) * 1000; // 이동 시간 (ms)

    //   // 총알 이동 효과 (애니메이션 대체)
    //   //console.log(`총알이 ${travelTime.toFixed(0)}ms 동안 날아감.`);

    //   const attackMotionPacket = create(B2C_TowerAttackMonsterNotificationSchema, {
    //     towerId: this.getId(),
    //     monsterPos: target.getPos(),
    //     travelTime: travelTime,
    //   });

    //   const attackMotionBuffer = PacketUtils.SerializePacket(
    //     attackMotionPacket,
    //     B2C_TowerAttackMonsterNotificationSchema,
    //     ePacketId.B2C_TowerAttackMonsterNotification,
    //     0,
    //   );
    //   //this.room.broadcast(attackMotionBuffer);

    //   setTimeout(() => {
    //     // 총알이 도착한 시점에 데미지 처리
    //     const isDestroyed = target.onDamaged(this.attackDamage);

    //     // 2. 클라이언트에 공격 패킷 전송
    //     const attackPacket = create(B2C_MonsterHealthUpdateNotificationSchema, {
    //       monsterId: target.getId(),
    //       hp: target.hp,
    //       maxHp: target.maxHp,
    //     });

    //     console.log('targetHp: ', target.hp);
    //     console.log('targetMaxHp: ', target.maxHp);

    //     const attackBuffer = PacketUtils.SerializePacket(
    //       attackPacket,
    //       B2C_MonsterHealthUpdateNotificationSchema,
    //       ePacketId.B2C_MonsterHealthUpdateNotification,
    //       0,
    //     );
    //     //this.room.broadcast(attackBuffer);

    //     // 3. 몬스터 사망 처리
    //     if (isDestroyed) {
    //       const monsterScore = target.score;

    //       // 점수를 GameRoom에 추가
    //       //this.room.addScore(monsterScore);
    //       const mopnsterDeathPacket = create(B2C_MonsterDeathNotificationSchema, {
    //         monsterId: target.getId(),
    //         score: target.score,
    //       });

    //       const monsterDeathBuffer = PacketUtils.SerializePacket(
    //         mopnsterDeathPacket,
    //         B2C_MonsterDeathNotificationSchema,
    //         ePacketId.B2C_MonsterDeathNotification,
    //         0, //수정 부분
    //       );

    //       //this.room.broadcast(monsterDeathBuffer);
    //     }
    //   }, travelTime); // 총알 이동 시간 이후 실행
    // }
  }

  /**
   * @param {number} attackDamage - 가하는 데미지
   * @return {boolean} - 몬스터 사망 여부
   */
  onDamaged(attackDamage: number): boolean {
    this.hp = Math.max(this.hp - attackDamage, 0);
    if (this.hp <= 0) {
      this.onDeath();
      return true; // 타워 hp가 0보다 작다면 onDeath 수행
    }
    return false; // 타워 hp가 0보다 크다면 공격 수행
  }

  onDeath() {
    //this.room.removeObject(this.getId());
  }

  update() {}
}
