// @generated by protoc-gen-es v2.2.2 with parameter "target=ts"
// @generated from file room.proto (package Protocol, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import type { GamePlayerData, PosInfo, RoomData, UserData } from "./struct_pb";
import { file_struct } from "./struct_pb";
import type { Message } from "@bufbuild/protobuf";

/**
 * Describes the file room.proto.
 */
export const file_room: GenFile = /*@__PURE__*/
  fileDesc("Cgpyb29tLnByb3RvEghQcm90b2NvbCI5ChVDMkxfQ3JlYXRlUm9vbVJlcXVlc3QSDAoEbmFtZRgBIAEoCRISCgptYXhVc2VyTnVtGAIgASgFIk0KFkwyQ19DcmVhdGVSb29tUmVzcG9uc2USEQoJaXNTdWNjZXNzGAEgASgIEiAKBHJvb20YAiABKAsyEi5Qcm90b2NvbC5Sb29tRGF0YSI/ChlMMkJfQ3JlYXRlR2FtZVJvb21SZXF1ZXN0Eg4KBnJvb21JZBgBIAEoBRISCgptYXhQbGF5ZXJzGAIgASgFIj4KGUIyTF9DcmVhdGVHYW1lUm9vbVJlc3BvbmUSEQoJaXNDcmVhdGVkGAEgASgIEg4KBnJvb21JZBgCIAEoBSIvCg1DMkxfR2FtZVN0YXJ0Eg4KBnVzZXJJZBgBIAEoCRIOCgZyb29tSWQYAiABKAUiOwoNTDJDX0dhbWVTdGFydBIMCgRob3N0GAEgASgJEgwKBHBvcnQYAiABKAUSDgoGcm9vbUlkGAMgASgFIjgKFEwyQl9HYW1lU3RhcnRSZXF1ZXN0EgwKBG5hbWUYASABKAkSEgoKbWF4VXNlck51bRgCIAEoBSJ3ChlCMkNfR2FtZVN0YXJ0Tm90aWZpY2F0aW9uEi0KC3BsYXllckRhdGFzGAEgAygLMhguUHJvdG9jb2wuR2FtZVBsYXllckRhdGESKwoQb2JzdGFjbGVQb3NJbmZvcxgCIAMoCzIRLlByb3RvY29sLlBvc0luZm8iGAoWQzJMX0dldFJvb21MaXN0UmVxdWVzdCI8ChdMMkNfR2V0Um9vbUxpc3RSZXNwb25zZRIhCgVyb29tcxgBIAMoCzISLlByb3RvY29sLlJvb21EYXRhIksKE0MyTF9Kb2luUm9vbVJlcXVlc3QSDgoGcm9vbUlkGAEgASgFEiQKCGpvaW5Vc2VyGAIgASgLMhIuUHJvdG9jb2wuVXNlckRhdGEiTwoUTDJDX0pvaW5Sb29tUmVzcG9uc2USEQoJaXNTdWNjZXNzGAEgASgIEiQKCHJvb21JbmZvGAIgASgLMhIuUHJvdG9jb2wuUm9vbURhdGEiQAoYTDJDX0pvaW5Sb29tTm90aWZpY2F0aW9uEiQKCGpvaW5Vc2VyGAEgASgLMhIuUHJvdG9jb2wuVXNlckRhdGEiKAoTQjJDX0pvaW5Sb29tUmVxdWVzdBIRCglpc1N1Y2Nlc3MYASABKAgiJgoUQzJMX0xlYXZlUm9vbVJlcXVlc3QSDgoGcm9vbUlkGAEgASgFIioKFUwyQ19MZWF2ZVJvb21SZXNwb25zZRIRCglpc1N1Y2Nlc3MYASABKAgiKwoZTDJDX0xlYXZlUm9vbU5vdGlmaWNhdGlvbhIOCgZ1c2VySWQYASABKAkiMQocQjJDX2luY3JlYXNlV2F2ZU5vdGlmaWNhdGlvbhIRCglpc1N1Y2Nlc3MYASABKAgiNwoiQjJMX1NvY2tldERpc2Nvbm5lY3RlZE5vdGlmaWNhdGlvbhIRCglzZXNzaW9uSWQYASABKAkiLAoXQjJDX0dhbWVFbmROb3RpZmljYXRpb24SEQoJaXNTdWNjZXNzGAEgASgIYgZwcm90bzM", [file_struct]);

/**
 * @generated from message Protocol.C2L_CreateRoomRequest
 */
export type C2L_CreateRoomRequest = Message<"Protocol.C2L_CreateRoomRequest"> & {
  /**
   * @generated from field: string name = 1;
   */
  name: string;

  /**
   * @generated from field: int32 maxUserNum = 2;
   */
  maxUserNum: number;
};

/**
 * Describes the message Protocol.C2L_CreateRoomRequest.
 * Use `create(C2L_CreateRoomRequestSchema)` to create a new message.
 */
export const C2L_CreateRoomRequestSchema: GenMessage<C2L_CreateRoomRequest> = /*@__PURE__*/
  messageDesc(file_room, 0);

/**
 * @generated from message Protocol.L2C_CreateRoomResponse
 */
export type L2C_CreateRoomResponse = Message<"Protocol.L2C_CreateRoomResponse"> & {
  /**
   * @generated from field: bool isSuccess = 1;
   */
  isSuccess: boolean;

  /**
   * @generated from field: Protocol.RoomData room = 2;
   */
  room?: RoomData;
};

/**
 * Describes the message Protocol.L2C_CreateRoomResponse.
 * Use `create(L2C_CreateRoomResponseSchema)` to create a new message.
 */
export const L2C_CreateRoomResponseSchema: GenMessage<L2C_CreateRoomResponse> = /*@__PURE__*/
  messageDesc(file_room, 1);

/**
 * @generated from message Protocol.L2B_CreateGameRoomRequest
 */
export type L2B_CreateGameRoomRequest = Message<"Protocol.L2B_CreateGameRoomRequest"> & {
  /**
   * @generated from field: int32 roomId = 1;
   */
  roomId: number;

  /**
   * 게임에 참가하는 인원수
   *
   * @generated from field: int32 maxPlayers = 2;
   */
  maxPlayers: number;
};

/**
 * Describes the message Protocol.L2B_CreateGameRoomRequest.
 * Use `create(L2B_CreateGameRoomRequestSchema)` to create a new message.
 */
export const L2B_CreateGameRoomRequestSchema: GenMessage<L2B_CreateGameRoomRequest> = /*@__PURE__*/
  messageDesc(file_room, 2);

/**
 * @generated from message Protocol.B2L_CreateGameRoomRespone
 */
export type B2L_CreateGameRoomRespone = Message<"Protocol.B2L_CreateGameRoomRespone"> & {
  /**
   * @generated from field: bool isCreated = 1;
   */
  isCreated: boolean;

  /**
   * @generated from field: int32 roomId = 2;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2L_CreateGameRoomRespone.
 * Use `create(B2L_CreateGameRoomResponeSchema)` to create a new message.
 */
export const B2L_CreateGameRoomResponeSchema: GenMessage<B2L_CreateGameRoomRespone> = /*@__PURE__*/
  messageDesc(file_room, 3);

/**
 * @generated from message Protocol.C2L_GameStart
 */
export type C2L_GameStart = Message<"Protocol.C2L_GameStart"> & {
  /**
   * 방장(보내는 사람)의 ID
   *
   * @generated from field: string userId = 1;
   */
  userId: string;

  /**
   * 입장하려는 Room ID
   *
   * @generated from field: int32 roomId = 2;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.C2L_GameStart.
 * Use `create(C2L_GameStartSchema)` to create a new message.
 */
export const C2L_GameStartSchema: GenMessage<C2L_GameStart> = /*@__PURE__*/
  messageDesc(file_room, 4);

/**
 * @generated from message Protocol.L2C_GameStart
 */
export type L2C_GameStart = Message<"Protocol.L2C_GameStart"> & {
  /**
   * ex: localhost
   *
   * @generated from field: string host = 1;
   */
  host: string;

  /**
   * 포트번호
   *
   * @generated from field: int32 port = 2;
   */
  port: number;

  /**
   * @generated from field: int32 roomId = 3;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.L2C_GameStart.
 * Use `create(L2C_GameStartSchema)` to create a new message.
 */
export const L2C_GameStartSchema: GenMessage<L2C_GameStart> = /*@__PURE__*/
  messageDesc(file_room, 5);

/**
 * @generated from message Protocol.L2B_GameStartRequest
 */
export type L2B_GameStartRequest = Message<"Protocol.L2B_GameStartRequest"> & {
  /**
   * @generated from field: string name = 1;
   */
  name: string;

  /**
   * @generated from field: int32 maxUserNum = 2;
   */
  maxUserNum: number;
};

/**
 * Describes the message Protocol.L2B_GameStartRequest.
 * Use `create(L2B_GameStartRequestSchema)` to create a new message.
 */
export const L2B_GameStartRequestSchema: GenMessage<L2B_GameStartRequest> = /*@__PURE__*/
  messageDesc(file_room, 6);

/**
 * @generated from message Protocol.B2C_GameStartNotification
 */
export type B2C_GameStartNotification = Message<"Protocol.B2C_GameStartNotification"> & {
  /**
   * @generated from field: repeated Protocol.GamePlayerData playerDatas = 1;
   */
  playerDatas: GamePlayerData[];

  /**
   * @generated from field: repeated Protocol.PosInfo obstaclePosInfos = 2;
   */
  obstaclePosInfos: PosInfo[];
};

/**
 * Describes the message Protocol.B2C_GameStartNotification.
 * Use `create(B2C_GameStartNotificationSchema)` to create a new message.
 */
export const B2C_GameStartNotificationSchema: GenMessage<B2C_GameStartNotification> = /*@__PURE__*/
  messageDesc(file_room, 7);

/**
 * @generated from message Protocol.C2L_GetRoomListRequest
 */
export type C2L_GetRoomListRequest = Message<"Protocol.C2L_GetRoomListRequest"> & {
};

/**
 * Describes the message Protocol.C2L_GetRoomListRequest.
 * Use `create(C2L_GetRoomListRequestSchema)` to create a new message.
 */
export const C2L_GetRoomListRequestSchema: GenMessage<C2L_GetRoomListRequest> = /*@__PURE__*/
  messageDesc(file_room, 8);

/**
 * @generated from message Protocol.L2C_GetRoomListResponse
 */
export type L2C_GetRoomListResponse = Message<"Protocol.L2C_GetRoomListResponse"> & {
  /**
   * @generated from field: repeated Protocol.RoomData rooms = 1;
   */
  rooms: RoomData[];
};

/**
 * Describes the message Protocol.L2C_GetRoomListResponse.
 * Use `create(L2C_GetRoomListResponseSchema)` to create a new message.
 */
export const L2C_GetRoomListResponseSchema: GenMessage<L2C_GetRoomListResponse> = /*@__PURE__*/
  messageDesc(file_room, 9);

/**
 * @generated from message Protocol.C2L_JoinRoomRequest
 */
export type C2L_JoinRoomRequest = Message<"Protocol.C2L_JoinRoomRequest"> & {
  /**
   * @generated from field: int32 roomId = 1;
   */
  roomId: number;

  /**
   * @generated from field: Protocol.UserData joinUser = 2;
   */
  joinUser?: UserData;
};

/**
 * Describes the message Protocol.C2L_JoinRoomRequest.
 * Use `create(C2L_JoinRoomRequestSchema)` to create a new message.
 */
export const C2L_JoinRoomRequestSchema: GenMessage<C2L_JoinRoomRequest> = /*@__PURE__*/
  messageDesc(file_room, 10);

/**
 * @generated from message Protocol.L2C_JoinRoomResponse
 */
export type L2C_JoinRoomResponse = Message<"Protocol.L2C_JoinRoomResponse"> & {
  /**
   * @generated from field: bool isSuccess = 1;
   */
  isSuccess: boolean;

  /**
   * 방 정보(방ID, 방 이름, 현재 인원 수, 최대 인원 수)
   *
   * @generated from field: Protocol.RoomData roomInfo = 2;
   */
  roomInfo?: RoomData;
};

/**
 * Describes the message Protocol.L2C_JoinRoomResponse.
 * Use `create(L2C_JoinRoomResponseSchema)` to create a new message.
 */
export const L2C_JoinRoomResponseSchema: GenMessage<L2C_JoinRoomResponse> = /*@__PURE__*/
  messageDesc(file_room, 11);

/**
 * @generated from message Protocol.L2C_JoinRoomNotification
 */
export type L2C_JoinRoomNotification = Message<"Protocol.L2C_JoinRoomNotification"> & {
  /**
   * @generated from field: Protocol.UserData joinUser = 1;
   */
  joinUser?: UserData;
};

/**
 * Describes the message Protocol.L2C_JoinRoomNotification.
 * Use `create(L2C_JoinRoomNotificationSchema)` to create a new message.
 */
export const L2C_JoinRoomNotificationSchema: GenMessage<L2C_JoinRoomNotification> = /*@__PURE__*/
  messageDesc(file_room, 12);

/**
 * @generated from message Protocol.B2C_JoinRoomRequest
 */
export type B2C_JoinRoomRequest = Message<"Protocol.B2C_JoinRoomRequest"> & {
  /**
   * @generated from field: bool isSuccess = 1;
   */
  isSuccess: boolean;
};

/**
 * Describes the message Protocol.B2C_JoinRoomRequest.
 * Use `create(B2C_JoinRoomRequestSchema)` to create a new message.
 */
export const B2C_JoinRoomRequestSchema: GenMessage<B2C_JoinRoomRequest> = /*@__PURE__*/
  messageDesc(file_room, 13);

/**
 * @generated from message Protocol.C2L_LeaveRoomRequest
 */
export type C2L_LeaveRoomRequest = Message<"Protocol.C2L_LeaveRoomRequest"> & {
  /**
   * @generated from field: int32 roomId = 1;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.C2L_LeaveRoomRequest.
 * Use `create(C2L_LeaveRoomRequestSchema)` to create a new message.
 */
export const C2L_LeaveRoomRequestSchema: GenMessage<C2L_LeaveRoomRequest> = /*@__PURE__*/
  messageDesc(file_room, 14);

/**
 * @generated from message Protocol.L2C_LeaveRoomResponse
 */
export type L2C_LeaveRoomResponse = Message<"Protocol.L2C_LeaveRoomResponse"> & {
  /**
   * @generated from field: bool isSuccess = 1;
   */
  isSuccess: boolean;
};

/**
 * Describes the message Protocol.L2C_LeaveRoomResponse.
 * Use `create(L2C_LeaveRoomResponseSchema)` to create a new message.
 */
export const L2C_LeaveRoomResponseSchema: GenMessage<L2C_LeaveRoomResponse> = /*@__PURE__*/
  messageDesc(file_room, 15);

/**
 * @generated from message Protocol.L2C_LeaveRoomNotification
 */
export type L2C_LeaveRoomNotification = Message<"Protocol.L2C_LeaveRoomNotification"> & {
  /**
   * @generated from field: string userId = 1;
   */
  userId: string;
};

/**
 * Describes the message Protocol.L2C_LeaveRoomNotification.
 * Use `create(L2C_LeaveRoomNotificationSchema)` to create a new message.
 */
export const L2C_LeaveRoomNotificationSchema: GenMessage<L2C_LeaveRoomNotification> = /*@__PURE__*/
  messageDesc(file_room, 16);

/**
 * @generated from message Protocol.B2C_increaseWaveNotification
 */
export type B2C_increaseWaveNotification = Message<"Protocol.B2C_increaseWaveNotification"> & {
  /**
   * @generated from field: bool isSuccess = 1;
   */
  isSuccess: boolean;
};

/**
 * Describes the message Protocol.B2C_increaseWaveNotification.
 * Use `create(B2C_increaseWaveNotificationSchema)` to create a new message.
 */
export const B2C_increaseWaveNotificationSchema: GenMessage<B2C_increaseWaveNotification> = /*@__PURE__*/
  messageDesc(file_room, 17);

/**
 * @generated from message Protocol.B2L_SocketDisconnectedNotification
 */
export type B2L_SocketDisconnectedNotification = Message<"Protocol.B2L_SocketDisconnectedNotification"> & {
  /**
   * @generated from field: string sessionId = 1;
   */
  sessionId: string;
};

/**
 * Describes the message Protocol.B2L_SocketDisconnectedNotification.
 * Use `create(B2L_SocketDisconnectedNotificationSchema)` to create a new message.
 */
export const B2L_SocketDisconnectedNotificationSchema: GenMessage<B2L_SocketDisconnectedNotification> = /*@__PURE__*/
  messageDesc(file_room, 18);

/**
 * @generated from message Protocol.B2C_GameEndNotification
 */
export type B2C_GameEndNotification = Message<"Protocol.B2C_GameEndNotification"> & {
  /**
   * @generated from field: bool isSuccess = 1;
   */
  isSuccess: boolean;
};

/**
 * Describes the message Protocol.B2C_GameEndNotification.
 * Use `create(B2C_GameEndNotificationSchema)` to create a new message.
 */
export const B2C_GameEndNotificationSchema: GenMessage<B2C_GameEndNotification> = /*@__PURE__*/
  messageDesc(file_room, 19);

