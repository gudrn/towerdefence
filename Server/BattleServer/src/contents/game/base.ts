import { create } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { PosInfo } from "src/protocol/struct_pb";
import { B2C_BaseDestroyNotificationSchema } from "src/protocol/tower_pb";
import { GameRoom } from "../room/gameRoom";


export class Base {
    /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
    private hp: number;
    private maxHp: number;
    private position: PosInfo;
    private size: number;
    private room: GameRoom;
/*---------------------------------------------
    [생성자]
---------------------------------------------*/
    constructor(maxHp: number, position: PosInfo, room: GameRoom) {
        this.hp = this.maxHp = maxHp;
        this.position = position;
        this.size = 3; // 기본 크기 3x3

        this.room = room;
    }

    /**
     * [현재 체력 반환]
     * @returns {number}
     */
    getHp(): number {
        return this.hp;
    }

/*---------------------------------------------
    [onDamaged]
---------------------------------------------*/
    onDamaged(amount: number): void {
        this.hp -= amount;
        if (this.hp < 0){
            this.hp = 0;
            this.onDestroyed();
        } 
    }
/*---------------------------------------------
    [기지 파괴 처리]
---------------------------------------------*/
    public onDestroyed(): void {
        console.log(`기지가 파괴되었습니다.`);

        // 이걸 그냥 게임오버로 만들면 되는게 아닌지.
        const baseDestroyedPacket = create(B2C_BaseDestroyNotificationSchema, {
            isDestroied: true
        });

        const baseDestroyedBuffer = PacketUtils.SerializePacket(
            baseDestroyedPacket,
            B2C_BaseDestroyNotificationSchema,
            ePacketId.B2C_BaseDestroyNotification,
            0, //수정 부분
        );

        this.room.broadcast(baseDestroyedBuffer);  
    }

/*---------------------------------------------
    [isDestroyed]
---------------------------------------------*/
    isDestroyed(): boolean {
        return this.hp <= 0;
    }

    /**
     * [Base의 중앙 위치 반환]
     * @returns {PosInfo}
     */
    getPos(): PosInfo {
        return this.position;
    }

    /**
     * [Base의 3x3 타일 영역 반환]
     * @returns {Vec2[]}
     */
    getTiles(): { x: number; y: number }[] {
        const tiles:{ x: number; y: number }[] = [];
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

