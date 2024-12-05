import { Vec2 } from "ServerCore/src/utils/vec2.js";

export class Base {
    /**
     * @param {number} maxHp
     * @param {PosInfo} position - Base의 중앙 위치.
     */
    constructor(maxHp, position) {
        /** @type {number} */
        this.hp = this.maxHp = maxHp;

        /** @type {PosInfo} */
        this.position = position;

        /** @type {number} */
        this.size = 3; // 기본 크기 3x3
    }

    /**
     * [현재 체력 반환]
     * @returns {number}
     */
    getHp() {
        return this.hp;
    }

    /**
     * [Base 데미지 처리]
     * @param {number} amount
     */
    onDamaged(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        //console.log(`Base가 ${amount} 데미지를 받았습니다. 현재 HP: ${this.hp}`);
    }

    /**
     * [Base 파괴 여부 확인]
     * @returns {boolean}
     */
    isDestroyed() {
        return this.hp <= 0;
    }

    /**
     * [Base의 중앙 위치 반환]
     * @returns {PosInfo}
     */
    getPos() {
        return this.position;
    }

    /**
     * [Base의 3x3 타일 영역 반환]
     * @returns {Vec2[]}
     */
    getTiles() {
        const tiles = [];
        const startX = this.position.x - Math.floor(this.size / 2);
        const startY = this.position.y - Math.floor(this.size / 2);

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                tiles.push({ x: startX + x, y: startY + y });
            }
        }

        return tiles;
    }
}

