import { OBJECT_STATE_TYPE } from "../../protocol/enum_pb.js";
import { MathUtils } from "../../utils/mathUtils.js";

//abstract
export class GameObject {
    /*---------------------------------------------
    [생성자]
---------------------------------------------*/
    constructor(prefabId, pos, room) {
        this.prefabId = prefabId;
        this.pos = pos;
        this.room = room;

        this.state = OBJECT_STATE_TYPE.IDLE;
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

    setState(state) {
        this.state = state;
        //broadcast
        //this.room.broadcast();
    }

    setPos(pos){
        this.pos.x = pos.x;
        this.pos.y = pos.y;
    }
}
