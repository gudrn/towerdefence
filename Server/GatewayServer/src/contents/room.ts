import { create, toBinary } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { GatewaySession } from 'src/main/session/gatewaySession';
import { LobbySession } from 'src/main/session/lobbySession.js';
import { RoomStateType } from 'src/protocol/enum_pb';
import { RoomDataSchema, UserDataSchema } from 'src/protocol/struct_pb';

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
}
