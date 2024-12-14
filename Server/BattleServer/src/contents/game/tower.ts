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

/**
 * 타워 클래스
 * 게임 내의 모든 타워들의 기본 기능을 구현합니다.
 */
export class Tower extends GameObject {
  /*---------------------------------------------
    [멤버 변수]
  ---------------------------------------------*/
  private originalAttackDamage: number = 0; // 기본 공격력 (버프 적용 전)
  private attackDamage: number = 0; // 현재 공격력 (버프 적용 후)
  private attackRange: number = 0; // 공격 범위
  private attackCoolDown: number = 0; // 공격 쿨다운 시간
  public hp: number = 0; // 현재 체력
  public maxHp: number = 0; // 최대 체력
  private bulletSpeed = 0; // 투사체 속도
  public target: null | undefined; // 현재 타겟
  public lastAttackTime: number = 0; // 마지막 공격 시간
  private buffedBy: Set<string> = new Set(); // 버프를 주고 있는 타워 ID 목록

  // 특수 능력치들
  private buffAmount: number = 0; // 버프 타워의 공격력 증가량
  private slowDuration: number = 0; // 얼음 타워의 슬로우 지속시간
  private slowAmount: number = 0; // 얼음 타워의 슬로우량
  private explosionRadius: number = 0; // 미사일 타워의 폭발 범위


  /**
   * 타워 생성자
   * @param prefabId 타워의 고유 ID
   * @param pos 타워의 위치
   * @param room 게임룸 인스턴스
   */
  constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
    super(prefabId, pos, room);

    // 타워 데이터 로드
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
    this.slowDuration = towerData.slowDuration ?? 0; // 얼음 타워
    this.slowAmount = towerData.slowAmount ?? 0; // 얼음 타워
    this.explosionRadius = towerData.explosionRadius ?? 0; // 미사일 타워

    // 버프 타워인 경우 주변 타워들에게 버프 적용
    if (prefabId === 'BuffTower') {
      const towersInRange = this.getTowersInRange(Array.from(this.room.getTowers().values()));
      towersInRange.forEach((tower) => {
        tower.increaseAttackDamage([this]);
      });
    } else {
      // 일반 타워인 경우, 주변 버프 타워에게서 버프 받기
      const buffTowers = Array.from(this.room.getTowers().values()).filter(
        (t) => t.getPrefabId() === 'BuffTower',
      );

      buffTowers.forEach((buffTower) => {
        const inRangeTowers = buffTower.getTowersInRange([this]);
        if (inRangeTowers.length > 0) {
          this.increaseAttackDamage([buffTower]);
        }
      });
    }
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
      const distance = 
        (this.pos.x - monster.pos.x) * (this.pos.x - monster.pos.x) +
        (this.pos.y - monster.pos.y) * (this.pos.y - monster.pos.y);
  
      // 범위 내에서 가장 가까운 몬스터 찾기
      if (distance <= this.attackRange * this.attackRange && distance < minDistance) {
        minDistance = distance;
        closestMonster = monster;
      }
    }

    return closestMonster ? { monster: closestMonster, distance: minDistance } : null;
  }

  /**
   * 타워의 공격 처리
   * @param targetData 타겟 몬스터와 거리 정보
   */
  private attackTarget(targetData: { monster: SkillUseMonster; distance: number }) {
    this.lastAttackTime = Date.now();
    const { monster: target, distance } = targetData;
    if (!targetData) return;

    // 투사체 이동 시간 계산
    const travelTime = (distance / this.bulletSpeed) * 1000;

    // 공격 모션 패킷 전송
    const attackMotionBuffer = createTowerAttackMotionPacket(
      this.getId(),
      target.getPos(),
      travelTime,
    );
    this.room.broadcast(attackMotionBuffer);

    // 투사체 이동 시간 후 데미지 처리
    setTimeout(() => {
      // 타워 타입에 따른 공격 처리
      this.processAttack(target);

      // 공격 결과 패킷 전송
      const attackBuffer = createTowerAttackNotificationPacket(
        target.getId(),
        target.hp,
        target.maxHp,
      );
      this.room.broadcast(attackBuffer);

      // 몬스터 처치 처리
      if (target.hp <= 0) {
        const monsterScore = target.score;
        this.room.addScore(monsterScore);
        const monsterDeathBuffer = createDeathMoster(target.getId(), target.score);
        this.room.broadcast(monsterDeathBuffer);
      }
    }, travelTime);
  }

  /**
   * 타워 타입별 공격 처리
   * @param target 타겟 몬스터
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
        target.applySlowEffect(this.slowDuration, this.slowAmount);
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
        this.multipleThunderAttack(target);
        break;

      default:
        // 알 수 없는 타워 타입일 경우 일단 기본 공격 실행
        console.log(`알 수 없는 타워: ${this.getPrefabId()}`);
        target.onDamaged(this.attackDamage);
    }
  }
  /**
   * 버프 타워 범위 내 타워 찾기
   * @param towers 전체 타워 배열
   * @returns 범위 내 타워 배열
   */
  getTowersInRange(towers: Tower[]): Tower[] {
    // 범위 내 타워 배열 생성
    const towersInRange: Tower[] = [];

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
   * [공격력 증가]
   ---------------------------------------------*/
  increaseAttackDamage(towers: Tower[]) {
    // towers 배열의 각 요소에 대해 처리
    towers.forEach((tower) => {
      const towerId = tower.getId(); // 예시로 타워 ID를 가져온다고 가정

      // 해당 버프가 없을 때만 추가
      if (!this.buffedBy.includes(towerId)) {
        this.buffedBy.push(towerId);

        // 버프량 갱신
        this.attackDamage = this.originalAttackDamage + this.buffedBy.length * 5;

        console.log(`${this.getPrefabId()}: ${this.originalAttackDamage} -> ${this.attackDamage}`);

        // 버프 적용 패킷 전송
        const buffApplyPacket = createTowerBuffNotificationPacket(
          [{ getId: () => towerId }],
          'atkBuff',
          true,
        ); // 버프 적용
        this.room.broadcast(buffApplyPacket);
      }
    });
  }
  /**---------------------------------------------
   * [버프 해제]
   ---------------------------------------------*/
  removeBuffFromTower(towers: Tower[]) {
    towers.forEach((tower) => {
      const towerId = tower.getId(); // 타워의 ID를 가져옴

      if (this.buffedBy.includes(towerId)) {
        // 배열에서 타워 ID 제거
        this.buffedBy = this.buffedBy.filter((id) => id !== towerId);

        // 공격력 원래 값으로 복원
        this.attackDamage = this.originalAttackDamage;

        // 버프 해제 패킷 전송
        const buffRemovePacket = createTowerBuffNotificationPacket(
          [{ getId: () => towerId }],
          'atkBuff',
          false,
        ); // 버프 해제
        this.room.broadcast(buffRemovePacket);
      }
    });
  }

  /**
   * 버프 타워 파괴 시 모든 버프를 제거
   */
  removeAllBuffsFromTower() {
    if (this.getPrefabId() === 'BuffTower') {
      const towers = Array.from(this.room.getTowers().values());
      towers.forEach((tower) => {
        tower.removeBuffFromTower(towers);
      });
    }
  }

  /**
   * 미사일 타워의 범위 피해 처리
   */
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

        const splashDamageBuffer = createTowerAttackNotificationPacket(
          monster.getId(),
          monster.hp,
          monster.maxHp,
        );
        this.room.broadcast(splashDamageBuffer);
      }
    }
  }

  /**
   * 번개 타워의 다중 공격을 처리
   */
  private multipleThunderAttack(target: SkillUseMonster) {
    const MAX_TARGETS = 3; // 최대 타겟 수

    // 타워 범위 내 몬스터 찾기
    const monsters = Array.from(this.room.getMonsters().values());
    const nearbyMonsters = [];

    for (const monster of monsters) {
      // 주 타겟은 제외
      if (monster.getId() === target.getId()) continue;

      // 거리 계산 (제곱 상태로 비교하여 최적화)
      const distance =
        (this.pos.x - monster.pos.x) * (this.pos.x - monster.pos.x) +
        (this.pos.y - monster.pos.y) * (this.pos.y - monster.pos.y);

      // 타워 범위 내에 있으면 배열에 추가
      if (distance <= this.attackRange * this.attackRange) {
        nearbyMonsters.push(monster);
        // 최대 타겟 수에 도달하면 중단
        if (nearbyMonsters.length >= MAX_TARGETS - 1) break;
      }
    }
    // 추가 타겟 공격
    nearbyMonsters.forEach((monster) => {
      monster.onDamaged(this.attackDamage);
      const attackBuffer = createTowerAttackNotificationPacket(
        monster.getId(),
        monster.hp,
        monster.maxHp,
      );
      this.room.broadcast(attackBuffer);
    });
  }

  /**
   * 타워 데미지 처리
   * @param attackDamage 받은 데미지
   * @returns 타워가 파괴되었는지 여부
   */
  onDamaged(attackDamage: number): boolean {
    this.hp = Math.max(this.hp - attackDamage, 0);
    if (this.hp <= 0) {
      this.onDeath();
      return true;
    }
    return false;
  }

  /**
   * 타워 파괴 처리
   */
  onDeath() {
    if (this.getPrefabId() === 'BuffTower') {
      // 버프 타워가 파괴되면, 버프 받던 모든 타워들의 버프 해제
      this.removeAllBuffsFromTower();
    }
    // 타워가 파괴되면 게임에서 제거
    this.room.removeObject(this.getId());
  }

  /**
   * 타워의 상태 업데이트
   */
  update() {
    // 타워가 파괴되었으면 업데이트 하지 않음
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
