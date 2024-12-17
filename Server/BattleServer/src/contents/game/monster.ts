import { create } from '@bufbuild/protobuf';
import { assetManager } from 'src/utils/assetManager';
import { GameObject } from './gameObject';
import {
  B2G_MonsterAttackBaseNotificationSchema,
  B2G_MonsterAttackTowerNotificationSchema,
  B2G_MonsterDeathNotificationSchema,
  B2G_MonsterPositionUpdateNotificationSchema,
} from 'src/protocol/monster_pb';
import { PosInfo, PosInfoSchema } from 'src/protocol/struct_pb';
import { OBJECT_STATE_TYPE } from 'src/protocol/enum_pb';
import { Tower } from './tower';
import { Base } from './base';
import { GameRoom } from '../room/gameRoom';
import { MonsterSpawner } from '../room/monsterSpanwner';
import { MathUtils } from 'src/utils/mathUtils';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { sessionManager } from 'src/server';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { B2G_TowerDestroyNotificationSchema } from 'src/protocol/tower_pb';

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
    this.moveSpeed = monsterData.moveSpeed; // 이동 속도
    this.score = monsterData.score; // 점수
    this.waitUntil = 0; // 딜레이 시간
    this.moveSpeed = this.originalMoveSpeed = monsterData.moveSpeed; // 이동 속도 초기화 수정

    // console.log('------------');
    // console.log('몬스터 스포너');
    // console.log(this.pos.uuid);
    // console.log('------------');
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
  setAttackDamage(damage: number) {
    this.attackDamage = damage;
  }

  /*---------------------------------------------
    [몬스터 강화]
---------------------------------------------*/
  public statusMultiplier(multiplier: number) {
    this.maxHp = Math.floor(this.maxHp * multiplier);
    this.hp = this.maxHp;
    this.attackDamage = Math.floor(this.attackDamage * multiplier);
    //console.log(`몬스터가 강화되었습니다. `, this.maxHp);
  }

  /*---------------------------------------------
    [Update]
---------------------------------------------*/
  public update() {
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
  private UpdateIdle() {
    if (!this.room) return;

    // if (!this.target) {
    this.target = this.room.findCloseBuilding(this.getPos());
    // }

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

  /*---------------------------------------------
    [몬스터 이동]
---------------------------------------------*/
  private UpdateMove() {
    const now = Date.now();
    if (this.waitUntil > now) return;

    const packet = create(B2G_MonsterPositionUpdateNotificationSchema, {
      posInfo: this.getPos(),
      roomId: this.room.id,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      packet,
      B2G_MonsterPositionUpdateNotificationSchema,
      ePacketId.B2G_MonsterPositionUpdateNotification,
      0,
    );

    const session = sessionManager.getRandomSession();
    if (session == null) {
      throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, '배틀 세션을 찾지 못했습니다.');
    }
    session.send(sendBuffer);
    this.setState(OBJECT_STATE_TYPE.IDLE);
  }

  /*---------------------------------------------
    [몬스터 공격]
---------------------------------------------*/
  private UpdateSkill() {
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

  // /*---------------------------------------------
  //   [슬로우 효과 적용]
  //   - 몬스터의 이동속도를 감소시킵니다.
  // ---------------------------------------------*/
  // applySlowEffect(duration: number) {
  //   // 이미 슬로우 상태면 중복 방지
  //   if (this.isSlowed) return;
  //   this.isSlowed = true;
  //   this.moveSpeed = this.originalMoveSpeed * 0.5; // 50% 감속
  //   this.slowEffectEndTime = Date.now() + duration; // 슬로우 효과 종료 시간
  //   // 클라이언트에 슬로우 효과 패킷 전송
  //   const slowEffectBuffer = createMonsterSlowEffect(
  //     this.getId(),
  //     true, // 슬로우 적용
  //   );
  //   this.room.broadcast(slowEffectBuffer);
  // }
  // /*---------------------------------------------
  //   [슬로우 효과 해제]
  //   - 몬스터의 이동속도를 원래대로 복구합니다.
  // ---------------------------------------------*/
  // removeSlowEffect() {
  //   this.isSlowed = false;
  //   this.moveSpeed = this.originalMoveSpeed; // 이동 속도 원래대로 복구
  //   this.slowEffectEndTime = 0;
  //   // 클라이언트에 슬로우 효과 해제 패킷 전송
  //   const removeSlowEffectBuffer = createMonsterSlowEffect(
  //     this.getId(),
  //     false
  //   );
  //   this.room.broadcast(removeSlowEffectBuffer);
  // }

  /*---------------------------------------------
        [타워 공격]
    ---------------------------------------------*/
  private attackTarget(tower: Tower) {
    //console.log('attack');
    // 2. 클라이언트에 공격 패킷 전송
    const attackPacket = create(B2G_MonsterAttackTowerNotificationSchema, {
      monsterId: this.getId(),
      targetId: tower.getId(),
      hp: tower.hp,
      maxHp: tower.maxHp,
      roomId: this.room.id,
    });

    // 타워 데미지 처리
    const isDestroyed = tower.onDamaged(this.attackDamage);

    const attackBuffer = PacketUtils.SerializePacket(
      attackPacket,
      B2G_MonsterAttackTowerNotificationSchema,
      ePacketId.B2G_MonsterAttackTowerNotification,
      0,
    );
    this.room.broadcast(attackBuffer);

    // 3. 타워 파괴 처리
    if (isDestroyed) {
      console.log(`타워 ${tower.getId()}가 파괴되었습니다.`);
      this.room.removeObject(tower.getId()); // GameRoom에서 타워 제거

      const towerDestroyedPacket = create(B2G_TowerDestroyNotificationSchema, {
        isSuccess: true,
        towerId: tower.getId(),
        roomId: this.room.id,
      });

      const towerDestroyedBuffer = PacketUtils.SerializePacket(
        towerDestroyedPacket,
        B2G_TowerDestroyNotificationSchema,
        ePacketId.B2G_TowerDestroyNotification,
        0, //수정 부분
      );

      this.room.broadcast(towerDestroyedBuffer);
    }
  }

  /*---------------------------------------------
        [베이스 공격]
    ---------------------------------------------*/
  private attackBase(base: Base) {
    const baseAttackPacket = create(B2G_MonsterAttackBaseNotificationSchema, {
      monsterId: this.getId(),
      attackDamage: this.attackDamage,
      roomId: this.room.id,
    });

    const baseAttackBuffer = PacketUtils.SerializePacket(
      baseAttackPacket,
      B2G_MonsterAttackBaseNotificationSchema,
      ePacketId.B2G_MonsterAttackBaseNotification,
      0, //수정 부분
    );
    this.room.broadcast(baseAttackBuffer);

    //기지 데미지 처리
    const isDestroyed = base.onDamaged(this.attackDamage);
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

  /*---------------------------------------------
    [onDamaged]
      1. 몬스터 사망 패킷 전송
      2. gameRoom에 점수 추가
      3. monsters에서 제거
---------------------------------------------*/
  onDeath() {
    console.log(`몬스터 ${this.getId()}가 사망.`);

    //1. 몬스터 사망 패킷 전송
    {
      const mopnsterDeathPacket = create(B2G_MonsterDeathNotificationSchema, {
        monsterId: this.getId(),
        score: this.score,
        roomId: this.room.id,
      });

      const monsterDeathBuffer = PacketUtils.SerializePacket(
        mopnsterDeathPacket,
        B2G_MonsterDeathNotificationSchema,
        ePacketId.B2G_MonsterDeathNotification,
        0, //수정 부분
      );

      this.room.broadcast(monsterDeathBuffer);
    }

    //2. gameRoom에 점수 추가
    this.room.addScore(this.score);

    //3. monsters에서 제거
    this.room.removeObject(this.getId());
  }
}
