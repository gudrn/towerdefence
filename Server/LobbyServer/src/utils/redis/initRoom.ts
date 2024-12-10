
import { lobbyConfig, roomConfig } from "src/config/config";
import { redis } from "./redis";

export async function initLobbyRoom() {
    await redis.flushall(); //임시
    const isInitialized = await redis.exists(roomConfig.AVAILABLE_ROOM_IDS_KEY);

    if (!isInitialized) {
        const roomIds = Array.from({ length: roomConfig.MAX_ROOMS_SIZE }, (_, i) => i + 1);
        await redis.rpush(roomConfig.AVAILABLE_ROOM_IDS_KEY, ...roomIds);
        console.log("lobbyRoom이 초기화 되었습니다.");
    } else {
        console.log("lobby Room이 이미 초기화 되었습니다.");
    }
}