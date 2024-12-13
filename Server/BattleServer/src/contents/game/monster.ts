import { create } from '@bufbuild/protobuf';
import { assetManager } from 'src/utils/assetManager';
import { GameObject } from './gameObject';
import { PosInfo, PosInfoSchema } from 'src/protocol/struct_pb';
import { OBJECT_STATE_TYPE } from 'src/protocol/enum_pb';
import { Tower } from './tower';
import { Base } from './base';
import { GameRoom } from '../room/gameRoom';
import { MathUtils } from 'src/utils/mathUtils';
import {
  createAttackBase,
  createAttackTarget,
  createMonsterSlowEffect,
  createTowerDestroyed,
  createUpdateMove,
} from 'src/packet/monsterPacket';

/**
 * 몬스터를 나타내는 클래스입니다.
 * @extends GameObject
 */
export class Monster extends GameObject {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  private target: Tower | Base | null = null;
  public hp: number = 0; //현재 체력
  public maxHp: number = 0; //최대 체력
  private attackDamage: number = 0; //공격력
  private attackRange = 0; //공격 사거리
  private attackCoolDown: number = 0; //공격 속도
  private originalMoveSpeed: number = 0; //원래 이동 속도
  protected moveSpeed: number = 0; //이동 속도
  private waitUntil: number = 0; //동작 간 딜레이 시간
  public score: number = 0; //점수
  private isSlowed: boolean = false; // 슬로우 상태 체크용
  private slowEffectEndTime: number = 0; //슬로우 효과 종료 시간

  constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
    super(prefabId, pos, room);

    const monsterData = assetManager.getMonsterData(prefabId);
    if (monsterData == null) {
      console.log('[Monster constructor] 유효하지 않은 prefabId');
      return;
    }

    this.target = null; // 타겟
    this.hp = this.maxHp = monsterData.maxHp; // 체력
    this.attackDamage = monsterData.attackDamage; // 공격력
    this.attackRange = monsterData.attackRange; // 공격 사거리
    this.attackCoolDown = monsterData.attackCoolDown; // 공격 속도
    this.score = monsterData.score; // 점수
    this.waitUntil = 0; // 딜레이 시간
    this.moveSpeed = this.originalMoveSpeed = monsterData.moveSpeed; // 이동 속도 초기화 수정
  }

  getpos() {
    return this.pos;
  }
  getAttackDamage() {
    return this.attackDamage;
  }
  getAttackCoolDown() {
    return this.attackCoolDown;
  }
  setAttackCoolDown(coolDown: number) {
    this.attackCoolDown = coolDown;
  }
  getRoom() {
    return this.room;
  }
  /**
   * 몬스터를 강화하는 메서드
   * @param {number} multiplier - 강화 배율 0.1이면, 10%가 오름
   */
  statusMultiplier(multiplier: number) {
    this.maxHp = Math.floor(this.maxHp * multiplier);
    this.hp = this.maxHp;
    this.attackDamage = Math.floor(this.attackDamage * multiplier);
    console.log(`몬스터가 강화되었습니다. `, this.maxHp);
  }
  /**
   * 몬스터의 상태를 업데이트합니다.
   */
  update() {
    // 슬로우 효과 시간 체크
    if (this.slowEffectEndTime > 0 && Date.now() >= this.slowEffectEndTime) {
      this.removeSlowEffect(); // 시간지나면 효과 해제
    }

    switch (this.state) {
      case OBJECT_STATE_TYPE.IDLE:
        this.UpdateIdle();
        break;
      case OBJECT_STATE_TYPE.MOVE:
        this.UpdateMove();
        break;
      case OBJECT_STATE_TYPE.SKILL:
        this.UpdateSkill();
        break;
    }
  }

  /**
   * 몬스터의 IDLE 상태를 업데이트합니다.
   */
  UpdateIdle() {
    if (!this.room) return;

    //if (!this.target) {
    this.target = this.room.findCloseBuilding(this.getPos());
    //}

    if (this.target) {
      const pos = MathUtils.calcPosDiff(this.target.getPos(), this.getPos());
      const dist = Math.abs(pos.x) + Math.abs(pos.y);
      const attackRange = this.target instanceof Base ? this.attackRange + 1.5 : this.attackRange;

      if (dist <= attackRange) {
        console.log('monsterAttack: ', this.getId());
        this.waitUntil = Date.now() + this.attackCoolDown * 1000;
        this.setState(OBJECT_STATE_TYPE.SKILL);
      } else {
        const path = this.room.getMonsterManager().findPath(this.pos, this.target.getPos());
        if (path && path.length > 1) {
          const nextPos = path[1];
          if (this.room.getMonsterManager().canGo(nextPos)) {
            //console.log("이동 가능");
            this.setPos(create(PosInfoSchema, { x: nextPos.x, y: nextPos.y }));
            this.waitUntil = Date.now() + 1000;
            this.setState(OBJECT_STATE_TYPE.MOVE);
          } else {
            console.log('이동 불가능');
          }
        }
      }
    }
  }

  /**
   * 몬스터의 MOVE 상태를 업데이트합니다.
   */
  UpdateMove() {
    const now = Date.now();
    if (this.waitUntil > now) return;

    const sendBuffer = createUpdateMove(this.getPos.bind(this));

    this.room.broadcast(sendBuffer);
    this.setState(OBJECT_STATE_TYPE.IDLE);
  }

  /**
   * 몬스터의 SKILL 상태를 업데이트합니다.
   */
  UpdateSkill() {
    const now = Date.now();
    if (this.waitUntil > now) return;

    if (this.target) {
      if (this.target instanceof Tower) {
        this.attackTarget(this.target);
      } else if (this.target instanceof Base) {
        this.attackBase(this.target);
      } else {
        console.log('유효하지 않은 target');
      }
    } else {
      console.log('유효하지 않은 target2');
    }

    // 공격 패킷 전송

    this.setState(OBJECT_STATE_TYPE.IDLE);
  }

  /*---------------------------------------------
        [타워 공격]
    ---------------------------------------------*/

  attackTarget(tower: Tower) {
    // 1. 타워 데미지 처리
    const isDestroyed = tower.onDamaged(this.attackDamage); // 버프 상태일 때 더 높은 데미지

    // 2. 타워 파괴 처리
    if (isDestroyed) {
      console.log(`타워 ${tower.getId()}가 파괴되었습니다.`);
      this.room.removeObject(tower.getId()); // GameRoom에서 타워 제거

      const towerDestroyedBuffer = createTowerDestroyed(tower);
      this.room.broadcast(towerDestroyedBuffer);
      return;
    }
    // 3. 클라이언트에 공격 패킷 전송
    const attackBuffer = createAttackTarget(this.getId.bind(this), tower);

    this.room.broadcast(attackBuffer);
  }

  setAttackDamage(damage: number) {
    this.attackDamage = damage;
  }
  /**
   * 기지 공격
   */
  attackBase(base: Base) {
    const baseAttackBuffer = createAttackBase(this.getId.bind(this), this.attackDamage); // 버프 상태일 때 더 높은 데미지

    this.room.broadcast(baseAttackBuffer);

    // 기지 데미지 처리
    base.onDamaged(this.attackDamage); // 버프 상태일 때 더 높은 데미지
  }

  /*---------------------------------------------
    [슬로우 효과 적용]
    - 몬스터의 이동속도를 50% 감소시킵니다.
  ---------------------------------------------*/
  applySlowEffect(duration: number, slowAmount: number = 0.5) {
    // 이미 슬로우 상태면 중복 방지
    if (this.isSlowed) return;

    this.isSlowed = true;
    this.moveSpeed = this.originalMoveSpeed * (1 - slowAmount); // 50% 감속
    this.slowEffectEndTime = Date.now() + duration; // 슬로우 효과 종료 시간

    // 클라이언트에 슬로우 효과 패킷 전송
    const slowEffectBuffer = createMonsterSlowEffect(
      this.getId(),
      true, // 슬로우 적용
    );
    this.room.broadcast(slowEffectBuffer);
  }

  /*---------------------------------------------
    [슬로우 효과 해제]
    - 몬스터의 이동속도를 원래대로 복구합니다.
  ---------------------------------------------*/
  removeSlowEffect() {
    this.isSlowed = false;
    this.moveSpeed = this.originalMoveSpeed; // 이동 속도 원래대로 복구
    this.slowEffectEndTime = 0;

    // 클라이언트에 슬로우 효과 해제 패킷 전송
    const removeSlowEffectBuffer = createMonsterSlowEffect(this.getId(), false);
    this.room.broadcast(removeSlowEffectBuffer);
  }

  /*---------------------------------------------
    [onDamaged]
     - 몬스터가 데미지를 받았을 때 처리합니다.
---------------------------------------------*/
  onDamaged(attackDamage: number) {
    this.hp = Math.max(this.hp - attackDamage, 0);
    if (this.hp <= 0) {
      this.onDeath();
      return true; // 몬스터 hp가 0보다 작다면 onDeath 수행
    }
    return false; // 몬스터 hp가 0보다 크다면 공격 수행
  }

  /**
   * 몬스터가 죽었을 때 처리합니다.
   * @override
   */
  onDeath() {
    this.room.removeObject(this.getId());
  }
}
