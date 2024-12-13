import { OBJECT_STATE_TYPE } from "src/protocol/enum_pb";
import { GameRoom } from "../room/gameRoom";
import { PosInfo } from "src/protocol/struct_pb";


//abstract
export abstract class GameObject {
    protected prefabId: string;
    public pos: PosInfo;
    protected room: GameRoom;
    protected state: OBJECT_STATE_TYPE;

    /*---------------------------------------------
    [생성자]
    ---------------------------------------------*/
    constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
        this.prefabId = prefabId;
        this.pos = pos;
        this.room = room;
        this.state = OBJECT_STATE_TYPE.IDLE;
    }

    /*---------------------------------------------
        [onDeath]
        엔티티 사망 (추상 메서드처럼 구현 필요)
    ---------------------------------------------*/
    onDeath(): void {
        throw new Error("onDeath() must be implemented in a subclass");
    }

    getPos(): PosInfo {
        return this.pos;
    }

    getId(): string {
        return this.pos.uuid;
    }

    getPrefabId(): string {
        return this.prefabId;
    }

    setState(state: OBJECT_STATE_TYPE): void {
        this.state = state;
        //broadcast
        //this.room.broadcast();
    }

    setPos(pos: { x: number; y: number} ): void {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
    }
}
