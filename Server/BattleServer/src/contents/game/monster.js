import { GameObject } from './gameObject.js';
import { GameRoom } from '../room/GameRoom.js';
import { aStar } from './aStar.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { ePacketId } from 'ServerCore/src/network/packetId.js';
import { create } from '@bufbuild/protobuf';

export class Monster extends GameObject {
  constructor(pos, hp, maxHp, prefabId, attackDamage, attackRange, gameRoom) {
    super(pos, hp, maxHp, prefabId);
    this.attackDamage = attackDamage;
    this.attackRange = attackRange;
    /**
     * @type {GameRoom} gameRoom - 몬스터가 생성될 게임 방
     */
    this.gameRoom = gameRoom; // GameRoom 참조
    this.lastAttackTime = 0;
    this.attackCoolDown = 1000; // 1초
    this.lastUpdateTime = Date.now(); // 마지막 위치 업데이트 시간
    this.moveSpeed = moveSpeed; // 몬스터 기본 이동 속도
    this.currentSpeed = moveSpeed; // 현재 이동 속도 (디버프 적용 후)
    this.slowEffects = []; // 슬로우 효과 리스트
    this.currentPath = []; // 현재 경로
    this.currentNodeIndex = 0; // 현재 경로의 진행 상태
  }

  /**
   * 몬스터 이동 처리
   * @param {object} session - 현재 세션
   */
  monsterAction(session) {
    this.updateSlowEffects(); // 슬로우 효과 갱신

    /**
     *  A* 알고리즘을 통해 이동 경로 계산
     * 경로가 없거나 장애물이 업데이트된 경우 새 경로 계산
     * */
    if (this.currentPath.length === 0 || this.gameRoom.isObstacleUpdated) {
      this.currentPath = aStar(
        this.pos,
        this.gameRoom.base,
        this.gameRoom.grid,
        this.gameRoom.obstacles,
        1,
      );
      this.currentNodeIndex = 0; // 경로 초기화
    }

    // 경로 진행
    if (this.currentPath.length > 1 && this.currentNodeIndex < this.currentPath.length - 1) {
      const nextPos = this.currentPath[this.currentNodeIndex + 1];
      const distanceToNext = Math.sqrt(
        Math.pow(this.pos.x - nextPos.x, 2) + Math.pow(this.pos.y - nextPos.y, 2),
      );

      // 이동 속도 확인
      const elapsedTime = Date.now() - this.lastUpdateTime;
      const actualSpeed = distanceToNext / elapsedTime;

      if (distanceToNext > expectedTravelDistance) {
        console.warn(`이동 속도 저하 감지: 예상 ${this.expectedSpeed}, 실제 ${actualSpeed}`);
        this.pos = nextPos; // 강제 위치 업데이트
      } else {
        this.pos = nextPos; // 정상 이동
      }

      this.currentNodeIndex++;
    }

    console.log(`${this.name} 이동 중... 현재 위치: (${this.pos.x}, ${this.pos.y})`);

    // 타워가 범위 내에 있으면 공격
    const towerInRange = this.getTowerInRange();
    if (towerInRange) {
      this.attackTarget(towerInRange, session);
      return;
    }

    // 기지에 도달했는지 확인
    if (this.isAtBase()) {
      this.attackBase(session);
      return;
    }

    // 주기적으로 위치 동기화
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime >= this.gameRoom.updateInterval) {
      this.monsterPositionUpdate(session); // 패킷 전송
      this.lastUpdateTime = currentTime; // 타이머 갱신
    }
  }

  /**
   * 슬로우 효과 업데이트
   * - 슬로우 효과가 지속 시간에 따라 제거.
   * - 현재 이동 속도를 업데이트.
   */
  updateSlowEffects() {
    const currentTime = Date.now();

    // 슬로우 효과 갱신 및 만료된 효과 제거
    this.slowEffects = this.slowEffects.filter((effect) => {
      if (currentTime >= effect.endTime) {
        return false; // 효과 만료
      }
      return true;
    });

    // 현재 속도 계산 (기본 속도에 모든 디버프 적용)
    const slowFactor = this.slowEffects.reduce((factor, effect) => {
      return factor * (1 - effect.slowRate);
    }, 1);

    this.currentSpeed = Math.max(this.moveSpeed * slowFactor, 0.1); // 최소 속도 제한
  }

  /**
   * 슬로우 효과 추가
   * @param {number} slowRate - 감속 비율 (0.3 = 30% 감소)
   * @param {number} duration - 지속 시간 (ms)
   */
  addSlowEffect(slowRate, duration) {
    const endTime = Date.now() + duration;
    this.slowEffects.push({ slowRate, endTime });
    console.log(`슬로우 효과 적용: ${slowRate * 100}% 감소, ${duration}ms 지속`);
  }

  /**
   * 타워 범위 내 확인
   * @returns {object|null} - 범위 내 타워 객체 또는 null
   */
  getTowerInRange() {
    let closestTower = null;
    let minDistance = Infinity;

    for (const [id, towerPos] of this.gameRoom.towerList.entries()) {
      const distance =
        (this.pos.x - towerPos.x) * (this.pos.x - towerPos.x) +
        (this.pos.y - towerPos.y) * (this.pos.y - towerPos.y);

      if (distance <= this.range && distance < minDistance) {
        minDistance = distance;
        closestTower = { id, ...towerPos };
      }
    }
    return closestTower;
  }

  /**
   * 기지 도달 여부 확인
   * @returns {boolean}
   */
  isAtBase() {
    return this.pos.x === this.base.x && this.pos.y === this.base.y;
  }

  /**
   * 타워 공격
   * @param {object} tower - 타워 객체 { id, x, y }
   * @param {object} session - 현재 세션
   */
  attackTarget(tower, session) {
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime > this.attackCoolDown) {
      this.lastAttackTime = currentTime;

      // 2. 클라이언트에 공격 패킷 전송
      const attackPacket = create(B2C_MonsterAttackTowerNotificationSchema, {
        monsterId: this.getId(),
        targetId: tower.id,
        damage: this.attackDamage,
      });

      const attackBuffer = PacketUtils.SerializePacket(
        attackPacket,
        B2C_MonsterAttackTowerNotificationSchema,
        ePacketId.B2C_MonsterAttackTowerNotification,
        session.getNextSequence(),
      );
      session.broadcast(attackBuffer);

      // 타워 데미지 처리
      const isDestroyed = tower.onDamaged(this.attackDamage);

      // 타워 체력 동기화 패킷 생성 및 전송
      const towerHpPacket = create(B2C_UpdateTowerHPNotificationSchema, {
        towerId: tower.id,
        hp: tower.hp,
        maxHp: tower.maxHp,
      });

      const towerHpBuffer = PacketUtils.SerializePacket(
        towerHpPacket,
        B2C_UpdateTowerHPNotificationSchema,
        ePacketId.B2C_UpdateTowerHPNotification,
        session.getNextSequence(),
      );

      session.broadcast(towerHpBuffer);

      // 3. 타워 파괴 처리
      if (isDestroyed) {
        console.log(`타워 ${tower.id}가 파괴되었습니다.`);
        this.gameRoom.removeObject(tower.id, session); // GameRoom에서 타워 제거

        const towerDestroyedPacket = create(B2C_TowerDestroyNotificationSchema, {
          towerId: tower.id,
          isSuccess: true,
        });

        const towerDestroyedBuffer = PacketUtils.SerializePacket(
          towerDestroyedPacket,
          B2C_TowerDestroyNotificationSchema,
          ePacketId.B2C_TowerDestroyNotification,
          session.getNextSequence(),
        );

        session.broadcast(towerDestroyedBuffer);
      }
    }
  }

  /**
   * 기지 공격
   * @param {object} session - 현재 세션
   */
  attackBase(base, session) {
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime > this.attackCoolDown) {
      this.lastAttackTime = currentTime;

      const baseAttackPacket = create(B2C_BaseAttackNotificationSchema, {
        monsterId: this.getId(),
        baseId: base.id,
        damage: this.attackDamage,
      });

      const baseAttackBuffer = PacketUtils.SerializePacket(
        baseAttackPacket,
        B2C_BaseAttackNotificationSchema,
        ePacketId.B2C_BaseAttackNotification,
        session.getNextSequence(),
      );
      session.broadcast(baseAttackBuffer);

      // 기지 데미지 처리
      const isDestroyed = base.onDamaged(this.attackDamage);

      // 기지 체력 동기화 패킷 생성 및 전송
      const baseHpPacket = create(B2C_UpdateBaseHPNotificationSchema, {
        baseId: base.id,
        hp: base.hp,
        maxHp: base.maxHp,
      });

      const baseHpBuffer = PacketUtils.SerializePacket(
        baseHpPacket,
        B2C_UpdateBaseHPNotificationSchema,
        ePacketId.B2C_UpdateBaseHPNotification,
        session.getNextSequence(),
      );

      session.broadcast(baseHpBuffer);

      // 3. 기지 파괴 처리
      if (isDestroyed) {
        console.log(`기지가 파괴되었습니다.`);
        this.gameRoom.removeObject(base.id, session); // GameRoom에서 타워 제거

        // 이걸 그냥 게임오버로 만들면 되는게 아닌지.
        const baseDestroyedPacket = create(B2C_BaseDestroyNotificationSchema, {
          isSuccess: true,
        });

        const baseDestroyedBuffer = PacketUtils.SerializePacket(
          baseDestroyedPacket,
          B2C_BaseDestroyNotificationSchema,
          ePacketId.B2C_BaseDestroyNotification,
          session.getNextSequence(),
        );

        session.broadcast(baseDestroyedBuffer);
      }
    }
  }

  /**
   * 클라이언트에 위치 업데이트 패킷 전송
   * @param {object} session - 현재 세션
   */
  monsterPositionUpdate(session) {
    const positionPacket = create(B2C_MonsterPositionUpdateNotificationSchema, {
      monsterId: this.getId(),
      x: this.pos.x,
      y: this.pos.y,
    });

    const positionBuffer = PacketUtils.SerializePacket(
      positionPacket,
      B2C_MonsterPositionUpdateNotificationSchema,
      ePacketId.B2C_MonsterPositionUpdateNotification,
      session.getNextSequence(),
    );

    session.broadcast(positionBuffer);
  }
}
