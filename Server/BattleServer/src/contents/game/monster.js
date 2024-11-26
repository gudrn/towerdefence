import { GameObject } from "./gameObject.js";

export class Monster extends GameObject
{
    //range는 Vector2
    //클라 연결 테스트 후 나중에
    //constructor(pos, maxHp, prefabId, attackDamage, attackCoolDown, range, moveSpeed) {
    constructor(pos, maxHp, prefabId) {
        //super(pos, maxHp, prefabId, attackDamage, attackCoolDown, range);
        super(pos, maxHp, prefabId);
        //this.score = score;
        //this.moveSpeed = moveSpeed;
        //this.lastAttackTime = Date.now();
        //this.attackCoolDown = 3000;
    }
    
    /*
    * @param {GameObject} target - 때릴 오브젝트   
    */
    attackTarget(target){
        const currentTime = Date.now()
        if(currentTime-this.lastAttackTime>this.attackCoolDown){
            target.onDamaged(this.atk);
            this.lastAttackTime = currentTime;
        }
        //중복 요청시 처리
    }
    
    isInRange(t){
        const {x,y} = t.pos;
        const distance = Math.sqrt(Math.pow(this.pos.x-x,2)+Math.pow(this.pos.y-y,2));
        if(this.range >=distance) return true;
        else return false;
    }

    //override
    onDeath() {
        throw new Error("onDeath() must be implemented in a subclass");
    }

//       /**
//    * 고유 monsterId ID를 제거하는 함수
//    * @returns {string} 생성된 monsterId
//    */
//   removeMonster(monsterId = undefined) {
//     if (monsterId === undefined && this.monsterList.length > 0) {
//       this.monsterList.shift();
//     } else if (this.monsterList.length > 0) {
//       const index = this.monsterList.findIndex((monster) => monster.monsterId === monsterId);
//       if (index !== -1) {
//         const monster = this.monsterList.splice(index, 1)[0];
//         if (monster) this.getMonsterSearchAndReward(monster); // 죽인 몬스터가 진짜 있을 경우
//       }
//     }
//   }

//   getMonsterSearchAndReward = (monster) => {
//     const reward = monsterInfo.monsterInfo[monster.monsterNumber - 1];
//     this.score += reward.score;
//   };

//   /**
//    * monster 처치 시 보상주는 함수
//    * @returns {string} 생성된 monster
//    */
//   generateUniqueMonsterId() {
//     // roomId를 만드는데 UUID를 쓸건지는 자유
//     return `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
//   }

}