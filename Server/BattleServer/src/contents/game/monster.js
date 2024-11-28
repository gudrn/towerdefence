import { assetManager } from "src/utils/assetManager.js";
import { GameObject } from "./gameObject.js";

export class Monster extends GameObject
{
/*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
    target = null;
    hp = 0; //현재 체력
    maxHp = 0; //최대 체력
    attackDamage = 0; //공격력
    attackRange = 0; //공격 사거리
    attackCoolDown = 0; //공격 속도
    moveSpeed = 0; //이동 속도

    waitUntil = 0; //동작 간 딜레이 시간

/*---------------------------------------------
    [생성자]
---------------------------------------------*/
    constructor(prefabId, pos, room) {
        super(prefabId, pos, room);

        const monsterData = assetManager.getMonsterData(prefabId);
        if(monsterData == null) {
            console.log("[Monster constructor] 유효하지 않은 prefabId");
            return;
        }

        this.attackDamage = monsterData?.attackDamage;
        this.attackRange = monsterData?.attackRange;
        this.attackCoolDown = monsterData?.attackCoolDown;
        this.moveSpeed = monsterData.moveSpeed;
        this.hp = this.maxHp = monsterData?.maxHp;
    }

    Update() {
        switch (this.state)
        {
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

    /*---------------------------------------------
    [UpdateIdle]
    1. target이 없으면 room.findClosetTarget을 호출하여 가장 가까운 타겟을 찾는다.
    2. target이 공격 범위 안에 있으면 상태를 SKILL로 설정한다.
    3. target이 공격 범위 밖에 있으면 계산한 경로의 다음 위치로 이동한다.
    3-1. 상태를 MOVE로 설정한다.
---------------------------------------------*/
	UpdateIdle() {
        if(this.room == undefined){
            return;
        }

        //타겟 찾기
        if(this.target == null){
            this.target = this.room.findCloseBuilding(this.getPos());
        }

        if(this.target)
        {
            let pos = BattleUtils.calcPosDiff(this.target.getPos(), this.getPos());
            let dist = Math.abs(pos.x)+Math.abs(pos.y);
            if(dist == this.attackRange){
                //몬스터 상태 설정
                this.setState(SKILL, true);
            }
            else {
                let path = this.room.findPath(this.pos, this.target.getPos());
                if(path) {
                    if(path.length > 1) {
                        let nextPos = path[1];
                        if(this.room.canGo(nextPos)){
                            this.setPos(nextPos);
                            _waitUntil = this.moveSpeed * 1000 + Date.now();
                            this.setState(MOVE, true);
                        }
                    }
                }
            }
        }
    }

	UpdateMove() {
        let now = Date.now();
        if(this.waitUntil > now) {
            return;
        }

        setState(IDLE);
    }
    
	UpdateSkill() {
        let now = Date.now();
        if(this.waitUntil > now) {
            return;
        }    
        setState(IDLE);
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
}