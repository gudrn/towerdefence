import { create, toBinary } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { GatewaySession } from 'src/main/session/gatewaySession';
import { LobbySession } from 'src/main/session/lobbySession.js';
import { RoomStateType } from 'src/protocol/enum_pb';
import { G2B_CreateGameRoomRequestSchema, G2L_GameStartRequestSchema } from 'src/protocol/room_pb';
import { RoomDataSchema, UserDataSchema } from 'src/protocol/struct_pb';
import { battleSessionManager, lobbySessionManager } from 'src/server';

/**
 * Room 클래스
 * 게임 방 관리
 */
export class Room {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  private id: number;
  private users: Array<GatewaySession>;
  private maxPlayerCount: number;
  private battleServerId: string | null = null;

  constructor(id: number, maxPlayerCount: number) {
    this.id = id;
    this.users = new Array<GatewaySession>();
    this.maxPlayerCount = maxPlayerCount;
  }

/*---------------------------------------------
    [방 입장 응답]
  ---------------------------------------------*/
  public handleL2G_JoinRoomResponse(session: GatewaySession) {
    this.users.push(session);
  }
  

  broadcast(buffer: Buffer) {
    for (const user of this.users) {
      user.send(buffer);
    }
  }

  public getMaxPlayerCount() {
    return this.maxPlayerCount;
  }

  public getCurrentPlayerCount() {
    return this.users.length
  }

  public getBattleServerId(): string {
    if(this.battleServerId == null) {
      throw new CustomError(ErrorCodes.SERVER_NOT_INIT, "게임 시작 시 battleSession의 id를 할당해주세요");
    }
    return this.battleServerId
  }

  public setBattleServerd(battleServerId: string) {
    this.battleServerId = battleServerId;
  }

  public leaveRoom(userId: string){
    this.users = this.users.filter((user) => user.getId() !== userId);
  }

  public handleGameReadyRequest(userId: string){
    //모든 유저가 ready라면?
    console.log("나 호출 ㅇㅇ");
    if(this.isAllReady()){
      //1. 로비 서버에게 방 상태 변경 요청
      {
          const requestPacket = create(G2L_GameStartRequestSchema, {
              roomId: this.id,
              userId,
          });
      
          const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2L_GameStartRequestSchema, ePacketId.G2L_GameStartRequest, 0);
      
          const lobbySession = lobbySessionManager.getRandomSession();
          if(lobbySession == null) {
              console.log("[handleC2G_GameStartRequest]: 로비 세션이 존재하지 않습니다.");
              return;
          }
      
          lobbySession.send(sendBuffer);
      }
  
      // 2. 배틀 서버에게 방 생성 요청
      {
          const requestPacket = create(G2B_CreateGameRoomRequestSchema, {
              roomId: this.id,
              maxUserNum: this.getCurrentPlayerCount()
          });
  
          const sendBuffer = PacketUtils.SerializePacket(requestPacket, G2B_CreateGameRoomRequestSchema, ePacketId.G2B_CreateGameRoomRequest, 0);
  
          const battleSession = battleSessionManager.getRandomSession();
          if(battleSession == null) {
              console.log("[handleC2G_GameStartRequest]: 배틀 세션이 존재하지 않습니다.");
              return;
          }
  
          battleSession.send(sendBuffer);
      }
    }     
    else{
      console.log("이게 왜 false?");
    }
  }
  

  private isAllReady(){
    for(let user of this.users){
      if(user.isReady == false){
        return false;
      }
    }
    return true;
  }
}
