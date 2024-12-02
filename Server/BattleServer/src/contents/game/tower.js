import { assetManager } from "../../utils/assetManager.js";
import { GameObject } from "./gameObject.js";

export class Tower extends GameObject {
    /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
    /**
     * @type {number} attackDamage
     * @type {number} attackRange
     * @type {number} attackCoolDown
     * @type {number} hp
     * @type {number} maxHp
     */
    attackDamage = 0; //추후에 projectile 클래스를 추가할 예정, 타워는 공격력이 없음
    attackRange = 0;
    attackCoolDown = 0;
    hp = 0;
    maxHp = 0;

    /**---------------------------------------------
     * [생성자]
     * @param {string} prefabId 
     * @param {PosInfo} pos
     * @param {GameRoom} room 
     */
    //---------------------------------------------
    constructor(prefabId, pos, room){
        super(prefabId, pos, room);

        const towerData = assetManager.getTowerData(prefabId);
        if(towerData == null) {
            console.log("[Tower constructor] 유효하지 않은 prefabId");
            return;
        }

        this.attackDamage = towerData?.attackDamage;
        this.attackRange = towerData?.attackRange;
        this.attackCoolDown = towerData?.attackCoolDown;
        this.hp = this.maxHp = towerData?.maxHp;
    }

    onDamaged(amount) {
        throw new Error("Method not implemented.");
    }
    onDeath(){
        throw new Error("Method not implemented.");
    }
    
    update(){
        
    }
}
