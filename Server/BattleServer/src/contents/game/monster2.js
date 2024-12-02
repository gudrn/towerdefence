import { create } from '@bufbuild/protobuf';
import { GameObject } from './gameObject.js';
import { assetManager } from '../../utils/assetManager.js';
import { OBJECT_STATE_TYPE } from '../../protocol/enum_pb.js';
import { MathUtils } from '../../utils/mathUtils.js';
import { Base } from './base.js';
import { PosInfoSchema } from '../../protocol/struct_pb.js';
import { B2C_MonsterPositionUpdateNotificationSchema } from '../../protocol/monster_pb.js';
import { PacketUtils } from 'ServerCore/src/utils/packetUtils.js';
import { ePacketId } from 'ServerCore/src/network/packetId.js';


/**
 * 몬스터를 나타내는 클래스입니다.
 * @extends GameObject
 */
export class Monster extends GameObject {
    /**
     * @param {string} prefabId - 몬스터의 프리팹 ID.
     * @param {PosInfo} pos - 몬스터의 위치 정보.
     * @param {GameRoom} room - 몬스터가 속한 게임 방.
     */
    constructor(prefabId, pos, room) {
        super(prefabId, pos, room);

        const monsterData = assetManager.getMonsterData(prefabId);
        if (monsterData == null) {
            console.log("[Monster constructor] 유효하지 않은 prefabId");
            return;
        }

        this.target = null; // 타겟
        this.hp = this.maxHp = monsterData.maxHp; // 체력
        this.attackDamage = monsterData.attackDamage; // 공격력
        this.attackRange = monsterData.attackRange; // 공격 사거리
        this.attackCoolDown = monsterData.attackCoolDown; // 공격 속도
        this.moveSpeed = monsterData.moveSpeed; // 이동 속도
        this.waitUntil = 0; // 딜레이 시간

        console.log("------------");
        console.log("몬스터 스포너");
        console.log(this.pos.uuid);
        console.log("------------");
    }

    /**
     * 몬스터의 상태를 업데이트합니다.
     */
    update() {
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

        if (!this.target) {
            this.target = this.room.findCloseBuilding(this.getPos());
        }

        if (this.target) {
            const pos = MathUtils.calcPosDiff(this.target.getPos(), this.getPos());
            const dist = Math.abs(pos.x) + Math.abs(pos.y);
            const attackRange = this.target instanceof Base ? this.attackRange + 1 : this.attackRange;

            if (dist === attackRange) {
                console.log("monsterAttack");
                this.waitUntil = Date.now() + this.attackCoolDown * 1000;
                this.setState(OBJECT_STATE_TYPE.SKILL);
            } else {
                const path = this.room.findPath(this.pos, this.target.getPos());
                if (path && path.length > 1) {
                    const nextPos = path[1];
                    if (this.room.canGo(nextPos)) {
                        console.log("이동 가능");
                        this.setPos(create(PosInfoSchema, { x: nextPos.x, y: nextPos.y }));
                        this.waitUntil = Date.now() + 500;
                        this.setState(OBJECT_STATE_TYPE.MOVE);
                    } else {
                        console.log("이동 불가능");
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

        const packet = create(B2C_MonsterPositionUpdateNotificationSchema, {
            posInfo: this.getPos()
        });

        const sendBuffer = PacketUtils.SerializePacket(
            packet,
            B2C_MonsterPositionUpdateNotificationSchema,
            ePacketId.B2C_MonsterPositionUpdateNotification,
            0
        );

        this.room.broadcast(sendBuffer);
        this.setState(OBJECT_STATE_TYPE.IDLE);
    }

    /**
     * 몬스터의 SKILL 상태를 업데이트합니다.
     */
    UpdateSkill() {
        const now = Date.now();
        if (this.waitUntil > now) return;

        // 공격 패킷 전송

        this.setState(OBJECT_STATE_TYPE.IDLE);
    }

    /**
     * 몬스터가 데미지를 받았을 때 처리합니다.
     * @param {number} amount - 데미지 양.
     */
    onDamaged(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.onDeath();
        }
    }

    /**
     * 몬스터가 죽었을 때 처리합니다.
     * @override
     */
    onDeath() {
        throw new Error("Method not implemented.");
    }
}
