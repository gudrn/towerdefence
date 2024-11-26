import { MathUtils } from "../../utils/mathUtils.js";

//abstract
export class GameObject {
    constructor(pos, maxHp, prefabId) {
        this.pos = pos;
        this.hp = maxHp;
        this.maxHp = maxHp;
        this.prefabId = prefabId; // 엔티티 유형의 식별자 - 예: minecraft:skeleton
    }

    onDamaged(amount) {
        this.hp = MathUtils.clamp(this.hp - amount, 0, this.hp);
        if (this.hp === 0) {
            this.onDeath();
        }
    }

    /*---------------------------------------------
        [onDeath]
        엔티티 사망 (추상 메서드처럼 구현 필요)
    ---------------------------------------------*/
    onDeath() {
        throw new Error("onDeath() must be implemented in a subclass");
    }

    getPos() {
        return this.pos;
    }

    getId() {
        return this.pos.uuid;
    }

    getPrefabId() {
        return this.prefabId;
    }
}
