import { create } from "@bufbuild/protobuf";
import { ePacketId } from "ServerCore/network/packetId";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { PosInfo } from "src/protocol/struct_pb";
import { GameRoom } from "../room/gameRoom";
import { B2G_BaseDestroyNotificationSchema } from "src/protocol/tower_pb";
import { gameRoomManager } from "../room/gameRoomManager";
import { sessionManager } from "src/server";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";


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
    public onDamaged(amount: number): void {
        this.hp -= amount;
        //등호를 붙여야 합니다.
        if (this.hp <= 0){
            this.hp = 0;
            this.onDestroyed();
        } 
    }
/*---------------------------------------------
    [기지 파괴 처리]
---------------------------------------------*/
    public onDestroyed(): void {
        console.log(`기지가 파괴되었습니다.`);

        const baseDestroyedPacket = create(B2G_BaseDestroyNotificationSchema, {
            isDestroied: true,
            roomId: this.room.id
        });

        const baseDestroyedBuffer = PacketUtils.SerializePacket(
            baseDestroyedPacket,
            B2G_BaseDestroyNotificationSchema,
            ePacketId.B2G_BaseDestroyNotification,
            0, //수정 부분
        );

        this.room.broadcast(baseDestroyedBuffer);  

        // room제거
        gameRoomManager.deleteGameRoom(this.room.id);

        //로비 서버에 방 제거 요청(redis에 있는 룸 제거)
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

