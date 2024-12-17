import { create } from '@bufbuild/protobuf';
import { PosInfo } from 'src/protocol/struct_pb';
import { GameRoom } from '../room/gameRoom';
import { assetManager } from 'src/utils/assetManager';
import { GameObject } from './gameObject';
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
import { SkillUseMonster } from './skillUseMonster';

export class Tower extends GameObject {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
private originalAttackDamage: number = 0; // 기본 공격력 (버프 적용 전)
private attackDamage: number = 0; // 현재 공격력 (버프 적용 후)
private attackRange: number = 0; // 공격 범위
public attackCoolDown: number = 0; // 공격 쿨다운 시간
public hp: number = 0; // 현재 체력
public maxHp: number = 0; // 최대 체력
private bulletSpeed = 0; // 투사체 속도
public target: null | undefined; // 현재 타겟
public lastAttackTime: number = 0; // 마지막 공격 시간
private isBuffed: boolean = false; // 버프 유무

// 특수 능력치들
private buffAmount: number = 0; // 버프 타워의 공격력 증가량
private explosionRadius: number = 0; // 미사일 타워의 폭발 범위

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
    // 기본 스탯 초기화
    this.attackDamage = towerData.attackDamage;
    this.originalAttackDamage = this.attackDamage;
    this.attackRange = towerData.attackRange;
    this.attackCoolDown = towerData.attackCoolDown;
    this.hp = this.maxHp = towerData.maxHp;
    this.bulletSpeed = 15;
    this.lastAttackTime = 0;

    // 특수 능력치 초기화 (?? 연산자로 기본값 0 설정)
    this.buffAmount = towerData.buffAmount ?? 0; // 버프 타워
    this.explosionRadius = towerData.explosionRadius ?? 0; // 미사일 타워
  }

  /**
   * 공격 범위 내의 가장 가까운 몬스터를 찾습니다
   * @param monsters 현재 맵에 있는 모든 몬스터 배열
   * @returns 가장 가까운 몬스터와 그 거리, 없으면 null
   */
  private getMonsterInRange(
    monsters: SkillUseMonster[],
  ): { monster: SkillUseMonster; distance: number } | null {
    let closestMonster: SkillUseMonster | null = null;
    let minDistance = Infinity;

    for (const monster of monsters) {
      // 거리 계산
      const distance = Math.sqrt(
        (this.pos.x - monster.pos.x) * (this.pos.x - monster.pos.x) +
          (this.pos.y - monster.pos.y) * (this.pos.y - monster.pos.y),
      );

      // 범위 내에서 가장 가까운 몬스터 찾기
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

  /**
   * 타워의 공격 처리
   * @param targetData 타겟 몬스터와 거리 정보
   */
  private attackTarget(targetData: { monster: SkillUseMonster; distance: number }) {
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

  /**
   * 타워 타입별 공격 처리
   * @param target 타겟 몬스터
   * 
   [TODO] 
      - tower를 추상 클래스로 만들기기
      - processAttack을 가상함수로 만들기
   */
  private processAttack(target: SkillUseMonster) {
    switch (this.getPrefabId()) {
      case 'BasicTower':
        // 기본 타워: 단일 타겟 기본 공격
        target.onDamaged(this.attackDamage);
        break;

      case 'BuffTower':
        // 버프 타워: 주변 타워 버프 + 단일 타겟 기본 공격
        target.onDamaged(this.attackDamage);
        break;

      case 'IceTower':
        // 얼음 타워: 단일 타겟 공격 + 이동속도 감소 효과
        target.onDamaged(this.attackDamage);
        // target.applySlowEffect(this.slowDuration, this.slowAmount);
        break;

      case 'MissileTower':
        // 미사일 타워: 주 타겟 공격 + 범위 폭발 데미지
        target.onDamaged(this.attackDamage);
        this.splashDamage(target);
        break;

      case 'StrongTower':
        // 강력한 타워: 높은 데미지의 단일 타겟 공격
        target.onDamaged(this.attackDamage);
        break;

      case 'TankTower':
        // 탱크 타워: 높은 체력 + 단일 타겟 기본 공격
        target.onDamaged(this.attackDamage);
        break;

      case 'ThunderTower':
        // 번개 타워: 다중 타겟 공격 (최대 3타겟 동시 공격)
        target.onDamaged(this.attackDamage);
        // this.multipleThunderAttack(target);
        break;

      default:
        // 알 수 없는 타워 타입일 경우 일단 기본 공격 실행
        console.log(`알 수 없는 타워: ${this.getPrefabId()}`);
        target.onDamaged(this.attackDamage);
    }
  }

  /**---------------------------------------------
     * [범위 내 타워 찾기]
     * @param {Tower[]} towers - 전체 타워 배열
     * @returns {Tower[]} - 범위 내 타워 배열
     ---------------------------------------------*/
     getTowersInRange(): Tower[] {
      // 범위 내 타워 배열 생성
      const towersInRange: Tower[] = [];
      const towers = Array.from(this.room.getTowers().values());
  
      for (const tower of towers) {
        // 자기 자신은 제외
        if (tower.getId() === this.getId()) continue;
  
        // 거리 계산 (제곱 상태로 비교하여 최적화)
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
   * [버프 타워 범위 내 타워 찾기]
   ---------------------------------------------*/
  buffTowersInRange() {
    // 전체 타워 배열 생성
    const towers = Array.from(this.room.getTowers().values());

    for (const tower of towers) {
      // 자기 자신은 제외
      if (tower.getId() === this.getId()) continue;

      // 거리 계산 (제곱 상태로 비교하여 최적화)
      const distance =
        (this.pos.x - tower.pos.x) * (this.pos.x - tower.pos.x) +
        (this.pos.y - tower.pos.y) * (this.pos.y - tower.pos.y);

      // 범위 내에 있으면 버프 켜줌
      if (distance <= this.attackRange * this.attackRange) {
        tower.applyAttackBuff();
      }
    }
  }

  /**---------------------------------------------
  * [범위 내 버프타워 존재 여부]
  * 현재 타워의 공격 범위 내에 버프타워가 있는지 확인
  * 
  * @returns {boolean} 
   ---------------------------------------------*/
  isBuffTowerInRange(): boolean {
    // 공격 범위 내의 모든 타워 목록 가져오기
    const towersInRange: Tower[] = this.getTowersInRange();

    // 범위 내 타워가 존재하는 경우
    if (towersInRange.length != 0) {
      // 각 타워를 순회하며 버프타워 여부 확인
      for (const tower of towersInRange) {
        // 버프타워가 발견되면 true 반환
        if (tower.getPrefabId() === 'BuffTower') {
          return true;
        }
      }
    }

    // 버프타워를 찾지 못한 경우 false 반환
    return false;
  }

  /**---------------------------------------------
   * [버프 적용]
   ---------------------------------------------*/
   applyAttackBuff() {
    if (!this.isBuffed) {
      this.isBuffed = true;
      this.attackDamage = this.originalAttackDamage + this.buffAmount;
      console.log(`[버프 적용] ${this.getPrefabId()}: ${this.originalAttackDamage} -> ${this.attackDamage}`);

      // 버프 적용용 패킷 생성 및 전송
      const buffApplyPacket = create(B2G_TowerBuffNotificationSchema, {
        towerId: [this.getId()],
        buffType: 'atkBuff',
        isBuffed: true,
        roomId: this.room.id
      });

      const buffApplyBuffer = PacketUtils.SerializePacket(
        buffApplyPacket,
        B2G_TowerBuffNotificationSchema,
        ePacketId.B2G_TowerBuffNotification,
        0
      )
      this.room.broadcast(buffApplyBuffer);
    }
  }
  /**---------------------------------------------
   * [버프 해제]
   ---------------------------------------------*/
  removeAttackBuff() {
    this.isBuffed = false;

    this.attackDamage = this.originalAttackDamage;
    console.log(`[버프 해제] ${this.getPrefabId()}: ${this.attackDamage} -> ${this.originalAttackDamage}`);

    // 버프 해제 패킷 생성 및 전송
    const buffPacket = create(B2G_TowerBuffNotificationSchema, {
      towerId: [this.getId()],
      buffType: 'atkBuff',
      isBuffed: false,
      roomId: this.room.id
    });

    const buffBuffer = PacketUtils.SerializePacket(
      buffPacket,
      B2G_TowerBuffNotificationSchema,
      ePacketId.B2G_TowerBuffNotification,
      0
    );

    this.room.broadcast(buffBuffer);
  }



  private splashDamage(target: SkillUseMonster) {
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

  // /**---------------------------------------------
  //  * [공격력 증가]
  //  ---------------------------------------------*/
  //  increaseAttackDamage(towers: Tower[]) {
  //   // towers 배열의 각 요소에 대해 처리
  //   towers.forEach((tower) => {
  //     const towerId = tower.getId(); // 예시로 타워 ID를 가져온다고 가정

  //     // 해당 버프가 없을 때만 추가
  //     if (!this.buffedBy.includes(towerId)) {
  //       this.buffedBy.push(towerId);

  //       // 버프량 갱신
  //       this.attackDamage = this.originalAttackDamage + this.buffedBy.length * 5;

  //       console.log(`${this.getPrefabId()}: ${this.originalAttackDamage} -> ${this.attackDamage}`);

  //       // 버프 적용 패킷 전송
  //       const buffApplyPacket = create(B2G_TowerBuffNotificationSchema, {
  //         towerId: towers.map((tower) => tower.getId()),
  //         buffType: "atkBuff",
  //         isBuffed: true,
  //         roomId: this.room.id
  //       });

  //       const sendBuffer = PacketUtils.SerializePacket(buffApplyPacket, B2G_TowerBuffNotificationSchema, ePacketId.G2C_TowerBuffNotification, 0);
  //       this.room.broadcast(sendBuffer);
  //     }
  //   });
  // }

  /**
   * @param {number} attackDamage - 가하는 데미지
   * @return {boolean} - 몬스터 사망 여부
   */
  public override onDamaged(amount: number): boolean {
    this.hp = Math.max(this.hp - amount, 0);
    if (this.hp <= 0) {
      this.onDeath();
      return true; // 타워 hp가 0보다 작다면 onDeath 수행
    }
    return false; // 타워 hp가 0보다 크다면 공격 수행
  }

  onDeath() {
    if (this.getPrefabId() === 'BuffTower') {
      // 버프 타워가 파괴되면 범위 내의 타워들이 여전히 주변에 버프타워가 있는지 확인
      const towersInRange = this.getTowersInRange();

      for (let i = 0; i < towersInRange.length; i++) {
        if (!towersInRange[i].isBuffTowerInRange()) {
          towersInRange[i].removeAttackBuff();
        }
      }
    }

    // 타워가 파괴되면 게임에서 제거
    this.room.removeObject(this.getId());
  }

  public update() {
    if (this.hp <= 0) return;

    // 공격 쿨다운 체크 후 공격 가능하면 공격
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


//[TODO]
//길찾기 수정하기
//
//
//브로셔 작성 1명
//클라 수정 1명
//서버 2명