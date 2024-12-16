import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { CustomError } from "ServerCore/utils/error/customError";
import { ErrorCodes } from "ServerCore/utils/error/errorCodes";
import { G2L_CreateRoomRequestSchema, G2L_GameStartRequestSchema, G2L_GetRoomListRequestSchema, G2L_JoinRoomRequestSchema, L2G_CreateRoomResponseSchema, L2G_GetRoomListResponseSchema, L2G_JoinRoomNotificationSchema, L2G_JoinRoomResponseSchema } from "src/protocol/room_pb";
import { handleError } from "src/utils/errorHandler";
import { redis } from "src/utils/redis/redis";
import { LobbySession } from "../session/lobbySession";
import { lobbyConfig, roomConfig } from "src/config/config";
import { RoomData, RoomDataSchema, UserDataSchema } from "src/protocol/struct_pb";
import { PacketUtils } from "ServerCore/utils/packetUtils";
import { ePacketId } from "ServerCore/network/packetId";
import { RoomStateType } from "src/protocol/enum_pb";


/*---------------------------------------------
    [방 생성]
---------------------------------------------*/
export async function createRoomHandler(buffer: Buffer, session: LobbySession): Promise<void> {

    try {
        const packet = fromBinary(G2L_CreateRoomRequestSchema, buffer);

        // Redis에서 방 ID 가져오기
        const roomId = await redis.lpop(roomConfig.AVAILABLE_ROOM_IDS_KEY);
        if (!roomId) {
            handleError(session, new CustomError(ErrorCodes.ROOM_LIMIT_REACHED, "사용 가능한 방 ID가 없습니다."));
            return;
        }

        const roomData: RoomData = create(RoomDataSchema, {
            id: parseInt(roomId, 10),
            name: packet.name,
            maxUserNum: packet.maxUserNum,
            users: [],
        });

        const serialziedRoomData: Buffer = Buffer.from(toBinary(RoomDataSchema, roomData));
        await redis.set(`${roomConfig.ROOM_KEY}${roomId}`, serialziedRoomData);

        const response = create(L2G_CreateRoomResponseSchema, {
            isSuccess: true,
            room: roomData,
            userId: packet.userId
        });

        const sendBuffer = PacketUtils.SerializePacket(
            response,
            L2G_CreateRoomResponseSchema,
            ePacketId.L2G_CreateRoomResponse,
            session.getSequence()
        );
        session.send(sendBuffer);
    } catch (error) {
        console.error("방 생성 중 오류 발생:", error);
        handleError(session, error);
    }
}

 /*---------------------------------------------
   [방 목록 조회]
---------------------------------------------*/
export async function getRoomsHandler(buffer: Buffer, session: LobbySession): Promise<void> {
    //console.log("getRoomsHandler");

    // Redis에서 모든 방 키 가져오기
    const keys = await redis.keys(`${roomConfig.ROOM_KEY}*`);
    const roomsData: Array<RoomData> = [];

    // Redis에서 모든 방 데이터를 가져와 역직렬화
    for (const key of keys) {
      const serializedRoomData = await redis.getBuffer(key);
      if (serializedRoomData) {
        const roomData: RoomData = fromBinary(RoomDataSchema, serializedRoomData);
        roomsData.push(roomData);
      }
    }
 
    // 응답 패킷 생성
    const packet = fromBinary(G2L_GetRoomListRequestSchema, buffer);
    console.log("[getRoomsHandler] ", packet.userId);
    const responsePacket = create(L2G_GetRoomListResponseSchema, {
      rooms: roomsData,
      userId: packet.userId,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      responsePacket,
      L2G_GetRoomListResponseSchema,
      ePacketId.L2G_GetRoomListResponse,
      session.getSequence()
    );
    session.send(sendBuffer);
  }

 /*---------------------------------------------
   [방 입장]
---------------------------------------------*/
export async function enterRoomHandler(buffer: Buffer, session: LobbySession): Promise<void> {
    // 클라이언트가 보낸 패킷 역직렬화
    const packet = fromBinary(G2L_JoinRoomRequestSchema, buffer);
    console.log('enterRoomHandler');
    console.log(packet.roomId);
    
    // 1. 방 ID를 통해 해당 방을 가져오기
    const roomKey = `${roomConfig.ROOM_KEY}${packet.roomId}`;
    const serializedRoomData = await redis.getBuffer(roomKey);

    //유효성 검증
    if (!serializedRoomData) {
        handleError(session, new CustomError(ErrorCodes.INVALID_ROOM_ID, "유효하지 않은 방 ID입니다."));
        return;
    }

    // 2. 방이 가득 찼는지 확인
    const roomData: RoomData = fromBinary(RoomDataSchema, serializedRoomData);
    if (roomData.users.length >= roomData.maxUserNum) {
        handleError(session, new CustomError(ErrorCodes.ROOM_FULL, "방이 가득 찼습니다."));
        return;
    }

    // 3. 기존 플레이어 목록을 유저에게 보내기
    {
        const existingUsersResponse = create(L2G_JoinRoomResponseSchema, {
            isSuccess: true,
            roomInfo: roomData,
            userId: packet.userId
        });
        
        const sendBuffer = PacketUtils.SerializePacket(
            existingUsersResponse,
            L2G_JoinRoomResponseSchema,
            ePacketId.L2G_JoinRoomResponse,
            0
        );
        
        session.send(sendBuffer);
    }   
    // 4. 유저 추가
    const newUserData = create(UserDataSchema, {
        id: packet.userId,
        name: packet.nickname,
        prefabId: packet.prefabId
    })
    roomData.users.push(newUserData);

    // 업데이트된 방 데이터를 Redis에 저장
    const updatedSerializedRoomData = Buffer.from(toBinary(RoomDataSchema, roomData));
    await redis.set(roomKey, updatedSerializedRoomData);
  
    // 5. 새 유저 입장 정보를 다른 유저들에게 알리기
    {
        const notificationPacket = create(L2G_JoinRoomNotificationSchema, {
            joinUser: newUserData,
            roomId: packet.roomId
        });
        
        const sendBuffer = PacketUtils.SerializePacket(notificationPacket, L2G_JoinRoomNotificationSchema, ePacketId.L2G_JoinRoomNotification, 0);
        session.send(sendBuffer);
    }
}

 /*---------------------------------------------
   [게임 시작]
   방 상태 변경
---------------------------------------------*/
export async function gameStartHandler(buffer: Buffer, session: LobbySession): Promise<void> {
    console.log('gameStartHandler');

    // 클라이언트가 보낸 패킷 역직렬화
    const packet = fromBinary(G2L_GameStartRequestSchema, buffer);
    
    // 1. 방 ID를 통해 해당 방을 가져오기
    const roomKey = `${roomConfig.ROOM_KEY}${packet.roomId}`;
    const serializedRoomData = await redis.getBuffer(roomKey);

    //유효성 검증
    if (!serializedRoomData) {
        handleError(session, new CustomError(ErrorCodes.INVALID_ROOM_ID, "유효하지 않은 방 ID입니다."));
        return;
    }

    // 2. 방 상태 변경
    let roomData: RoomData = fromBinary(RoomDataSchema, serializedRoomData);
    roomData.state = RoomStateType.INAGAME;

    // 업데이트된 방 데이터를 Redis에 저장
    const updatedSerializedRoomData = Buffer.from(toBinary(RoomDataSchema, roomData));
    await redis.set(roomKey, updatedSerializedRoomData);
}

export async function onSocketDisconnected(playerId:string){
    const keys = await redis.keys(`${roomConfig.ROOM_KEY}*`);

    for (const key of keys) {
        const serializedRoomData = await redis.getBuffer(key);
        if (serializedRoomData) {
          const redisRoomData: RoomData = fromBinary(RoomDataSchema, serializedRoomData);
          redisRoomData.users = redisRoomData.users.filter((user)=>user.id!==playerId);
          if(redisRoomData.users.length===0){
            await redis.del(`${roomConfig.ROOM_KEY}${key}`)
          }else{
            const updatedSerializedRoomData = Buffer.from(toBinary(RoomDataSchema, redisRoomData));
            await redis.set(key,updatedSerializedRoomData);
          }
        }
      }

}