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
  protected attackDamage: number = 0; // 현재 공격력 (버프 적용 후)
  protected attackRange: number = 0; // 공격 범위
  public attackCoolDown: number = 0; // 공격 쿨다운 시간
  public hp: number = 0; // 현재 체력
  public maxHp: number = 0; // 최대 체력
  protected bulletSpeed = 0; // 투사체 속도
  public target: iMonsterDistance | null = null; // 현재 타겟
  public lastAttackTime: number = 0; // 마지막 공격 시간
  protected bufCount: number = 0; // 버프 유무

  // 특수 능력치들
  private buffAmount: number = 0; // 버프 타워의 공격력 증가량
  /*---------------------------------------------
    [생성자]
---------------------------------------------*/
  constructor(towerData: AssetTower, pos: PosInfo, room: GameRoom) {
    super(towerData.prefabId, pos, room);

    if (towerData == null) {
      console.log('[Tower constructor] 유효하지 않은 prefabId');
      return;
    }
    // 기본 스탯 초기화
    this.attackDamage = towerData.attackDamage;
    this.attackRange = towerData.attackRange;
    this.attackCoolDown = towerData.attackCoolDown;
    this.hp = this.maxHp = towerData.maxHp;
    this.bulletSpeed = 15;

    // 특수 능력치 초기화 (?? 연산자로 기본값 0 설정)
    this.buffAmount = towerData.buffAmount ?? 0;

    //버프 적용
    if(this.isBuffTowerInRange()) {
      this.applyAttackBuff();
    }
  }

  /*---------------------------------------------
      [Update]
  ---------------------------------------------*/
  public update() {
    if (this.hp <= 0) return;
  
    const currentTime = Date.now();
  
    // 타겟이 없거나 이미 죽었으면 새로 타겟을 찾음
    if (!this.target || this.target.monster.hp <= 0) {
      this.updateIdle();
    }
  
    // 공격 쿨다운이 끝났으면 공격
    if (this.target && currentTime - this.lastAttackTime >= this.attackCoolDown) {
      this.updateSkill();
    }
  }

  /*---------------------------------------------
      [updateIdle]
      - 공격 가능한 몬스터 찾기
  ---------------------------------------------*/
  private updateIdle() {
    const monsters = Array.from(this.room.getMonsters().values());
    const targetData = this.getMonsterInRange(monsters);
  
    if (targetData) {
      this.target = targetData; // 새 타겟 설정
    } else {
      this.target = null; // 타겟을 찾지 못하면 초기화
    }
  }

  /*---------------------------------------------
      [updateSkill]
      - 공격하기
  ---------------------------------------------*/
  private updateSkill() {
    if (!this.target || this.target.monster.hp <= 0) {
      this.target = null; // 타겟이 죽었으면 초기화
      return;
    }
  
    this.lastAttackTime = Date.now();
  
    const { monster: target, distance } = this.target;
  
    // 투사체 이동 시간 계산
    const travelTime = (distance / this.bulletSpeed) * 1000;
  
    // 투사체 패킷 전송
    const attackMotionPacket = create(B2G_TowerAttackMonsterNotificationSchema, {
      towerId: this.getId(),
      monsterPos: target.getPos(),
      travelTime: travelTime,
      roomId: this.room.id,
    });
  
    this.room.broadcast(PacketUtils.SerializePacket(
      attackMotionPacket,
      B2G_TowerAttackMonsterNotificationSchema,
      ePacketId.B2G_TowerAttackMonsterNotification,
      0,
    ));
  
    setTimeout(() => {
      // 타겟이 살아있는지 최종 확인 후 데미지 적용
      if (target.hp > 0) {
        this.processAttack(target);
      } else {
        this.target = null; // 타겟이 죽으면 초기화
      }
    }, travelTime);
  }

  /*---------------------------------------------
    [processAttack]
  - 특수 공격이 있는 타워들은 여기서 이벤트를 처리 
---------------------------------------------*/
protected processAttack(target: Monster) {
  target.onDamaged(this.getTotalDamage());

  const healthUpdatePacket = create(B2G_MonsterHealthUpdateNotificationSchema, {
    monsterId: target.getId(),
    hp: target.hp,
    roomId: this.room.id,
  });

  this.room.broadcast(PacketUtils.SerializePacket(
    healthUpdatePacket,
    B2G_MonsterHealthUpdateNotificationSchema,
    ePacketId.B2G_MonsterHealthUpdateNotification,
    0,
  ));
}

  /*---------------------------------------------
      [findCloseMonster]
      - 공격 범위 내의 가장 가까운 몬스터를 찾습니다

      - get으로 시작하는 메소드는 복잡도가 O(1)이어야 합니다.
      - 그렇지 않으면 find...등의 접두사를 사용하는 게 좋습니다
  ---------------------------------------------*/
  protected getMonsterInRange(monsters: Monster[]): { monster: Monster; distance: number } | null {
    let closestMonster: Monster | null = null;
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

/*---------------------------------------------
   [onDeath]
    타워가 파괴되면 게임에서 제거
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
   public override onDeath() {
    this.room.removeObject(this.getId());
  }

  protected getTowersInRange(): Tower[] {
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

  public isBuffTowerInRange(): boolean {
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
    this.bufCount+=1;
      // console.log(`[버프 적용] ${this.getPrefabId()}: ${this.originalAttackDamage} -> ${this.attackDamage}`);

    // 버프 적용용 패킷 생성 및 전송
    if(this.bufCount == 1) {
      const buffApplyPacket = create(B2G_TowerBuffNotificationSchema, {
        towerId: [this.getId()],
        buffType: 'atkBuff',
        isBuffed: true,
        roomId: this.room.id,
      });
  
      const buffApplyBuffer = PacketUtils.SerializePacket(
        buffApplyPacket,
        B2G_TowerBuffNotificationSchema,
        ePacketId.B2G_TowerBuffNotification,
        0,
      );
      this.room.broadcast(buffApplyBuffer);  
    }
  }
  

  /**---------------------------------------------
   * [버프 해제]
   ---------------------------------------------*/
  removeAttackBuff() {
    this.bufCount-=1
    // console.log(`[버프 해제] ${this.getPrefabId()}: ${this.attackDamage} -> ${this.originalAttackDamage}`);

    // 버프 해제 패킷 생성 및 전송
    if(this.bufCount <= 0){
      const buffPacket = create(B2G_TowerBuffNotificationSchema, {
        towerId: [this.getId()],
        buffType: 'atkBuff',
        isBuffed: false,
        roomId: this.room.id,
      });
  
      const buffBuffer = PacketUtils.SerializePacket(
        buffPacket,
        B2G_TowerBuffNotificationSchema,
        ePacketId.B2G_TowerBuffNotification,
        0,
      );
  
      this.room.broadcast(buffBuffer);
    }
  }

  /*---------------------------------------------
      [getter]
  ---------------------------------------------*/
  getAttackRange(): number {
    return this.attackRange;
  }
  getTotalDamage(): number {
    return this.attackDamage + (this.attackDamage * this.buffAmount);
  }
  getIsBuffed(): boolean {
    return this.bufCount > 0;
  }
}