import { Vec2 } from "ServerCore/utils/vec2";
import { Base } from "../base";
import { GameRoom } from "src/contents/room/gameRoom";
import { PosInfo, PosInfoSchema } from "src/protocol/struct_pb";
import { assetManager } from "src/utils/assetManager";
import { GameObject } from "../gameObject";
import { OBJECT_STATE_TYPE } from "src/protocol/enum_pb";
import { B2G_MonsterAttackBaseNotificationSchema, B2G_MonsterAttackTowerNotificationSchema, B2G_MonsterDeathNotificationSchema, B2G_MonsterPositionUpdateNotificationSchema } from "src/protocol/monster_pb";
import { create } from "@bufbuild/protobuf";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { sessionManager } from "src/server";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { CustomError } from "ServerCore/utils/error/customError";
import { MathUtils } from "src/utils/mathUtils";
import { B2G_TowerDestroyNotificationSchema } from "src/protocol/tower_pb";
import { Tower } from "../towers/tower";

//임시로 사용
export class Monster extends GameObject{
/*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
    private target: Tower | Base | null = null;

    public hp: number = 0; //현재 체력
    public maxHp: number = 0; //최대 체력
    protected attackDamage: number = 0; //공격력
    protected attackRange = 0; //공격 사거리
    protected attackCoolDown: number = 0; //공격 속도
    protected moveSpeed: number = 0; //이동 속도
    protected score: number = 0; //점수

    private waitUntil: number = 0; //동작 간 딜레이 시간
    private lastUpdated = 0; // 마지막 경로 계산 시간
    private path: Vec2[] | null = [];
    public attackBuffRate: number = 0;

  /*---------------------------------------------
    [생성자]
---------------------------------------------*/
    constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
        super(prefabId, pos, room);
        
        const monsterData = assetManager.getMonsterData(prefabId);
        if (monsterData == null) {
            console.log('[Monster constructor] 유효하지 않은 prefabId');
            return;
        }

        this.target = null; // 타겟

        this.hp = this.maxHp = Math.floor(monsterData.maxHp * room.getMultiplier()); // 체력
        this.attackDamage = Math.floor(monsterData.attackDamage * room.getMultiplier()); // 공격력
        this.attackRange = monsterData.attackRange; // 공격 사거리
        this.attackCoolDown = monsterData.attackCoolDown; // 공격 속도
        this.moveSpeed = monsterData.moveSpeed; // 이동 속도
        this.score = monsterData.score; // 점수

        this.waitUntil = 0; // 딜레이 시간
    }

  /*---------------------------------------------
      [Update]
  ---------------------------------------------*/
    public update() {
        switch (this.state) {
        case OBJECT_STATE_TYPE.IDLE:
            this.updateIdle();
            break;
        case OBJECT_STATE_TYPE.MOVE:
            this.updateMove();
            break;
        case OBJECT_STATE_TYPE.SKILL:
            this.updateSkill();
            break;
        }
    }

    private updateIdle() {
        const now = Date.now();
      
        // 2초마다 경로 재계산
        if (now - this.lastUpdated > 2000) {
          this.target = this.room.findCloseBuilding(this.getPos());
          if (this.target) {
            this.path = this.room.getMonsterManager().findPath(this.pos, this.target.getPos());
            this.lastUpdated = now;
          }
        }
      
        if (this.target) {
          // 거리 계산
          const posDiff = MathUtils.calcPosDiff(this.target.getPos(), this.getPos());
          const dist = Math.abs(posDiff.x) + Math.abs(posDiff.y);
          const attackRange = this.target instanceof Base ? this.attackRange + 1.5 : this.attackRange;
      
          if (dist <= attackRange) {
            // 공격 범위 내에 들어오면 상태를 SKILL로 변경
            this.waitUntil = now + this.attackCoolDown * 1000;
            this.setState(OBJECT_STATE_TYPE.SKILL);
            return;
          }
        }
      
        // 이동 상태 처리
        if (this.path && this.path.length > 1) {
          const nextPos = this.path[1];
          if (this.room.getMonsterManager().canGo(nextPos)) {
            this.setPos(create(PosInfoSchema, { x: nextPos.x, y: nextPos.y }));
            this.path.shift(); // 다음 위치로 이동 후 경로 업데이트
            this.setState(OBJECT_STATE_TYPE.MOVE);
            this.waitUntil = now + 1000;
          } else {
            console.log('이동 불가능');
          }
        } else {
          console.log('Path가 없습니다.');
        }
    }

    /*---------------------------------------------
        [몬스터 이동]
    ---------------------------------------------*/
      private updateMove() {
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
    private updateSkill() {
        const now = Date.now();
        if (this.waitUntil > now) return;
    
        if (this.target) {
          if (this.target instanceof Tower) {
            this.attackTower(this.target);
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
    private attackTower(tower: Tower) {
        // 2. 클라이언트에 공격 패킷 전송
        const attackPacket = create(B2G_MonsterAttackTowerNotificationSchema, {
            monsterId: this.getId(),
            targetId: tower.getId(),
            hp: tower.hp,
            roomId: this.room.id,
        });
    
        // 타워 데미지 처리
        
        tower.onDamaged(this.getTotalDamage());
    
        const attackBuffer = PacketUtils.SerializePacket(
            attackPacket,
            B2G_MonsterAttackTowerNotificationSchema,
            ePacketId.B2G_MonsterAttackTowerNotification,
            0,
        );
        this.room.broadcast(attackBuffer);
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
        base.onDamaged(this.getTotalDamage());
    }

    /*---------------------------------------------
        [onDamaged]
    ---------------------------------------------*/
    override onDamaged(attackDamage: number): void {
        this.hp = Math.max(this.hp - attackDamage, 0);
        if (this.hp <= 0) {
          this.onDeath();
        }
    }
    
    /*---------------------------------------------
    [onDeath]
    1. 몬스터 사망 패킷 전송
    2. gameRoom에 점수 추가
    3. monsters에서 제거
---------------------------------------------*/
    override onDeath() {
    
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

    getTotalDamage(): number{
        return this.attackDamage + (this.attackDamage*this.attackBuffRate);
    }
}