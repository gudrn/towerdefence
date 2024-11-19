// @generated by protoc-gen-es v2.2.2 with parameter "target=js"
// @generated from file room.proto (package Protocol, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import { file_struct } from "./struct_pb";

/**
 * Describes the file room.proto.
 */
export const file_room = /*@__PURE__*/
  fileDesc("Cgpyb29tLnByb3RvEghQcm90b2NvbCI5ChVDMkxfQ3JlYXRlUm9vbVJlcXVlc3QSDAoEbmFtZRgBIAEoCRISCgptYXhVc2VyTnVtGAIgASgFIk0KFkwyQ19DcmVhdGVSb29tUmVzcG9uc2USEQoJaXNTdWNjZXNzGAEgASgIEiAKBHJvb20YAiABKAsyEi5Qcm90b2NvbC5Sb29tRGF0YSI/ChlMMkJfQ3JlYXRlR2FtZVJvb21SZXF1ZXN0Eg4KBnJvb21JZBgBIAEoBRISCgptYXhQbGF5ZXJzGAIgASgFIj4KGUIyTF9DcmVhdGVHYW1lUm9vbVJlc3BvbmUSEQoJaXNDcmVhdGVkGAEgASgIEg4KBnJvb21JZBgCIAEoBSIvCg1DMkxfR2FtZVN0YXJ0Eg4KBnVzZXJJZBgBIAEoCRIOCgZyb29tSWQYAiABKAUiOwoNTDJDX0dhbWVTdGFydBIMCgRob3N0GAEgASgJEgwKBHBvcnQYAiABKAUSDgoGcm9vbUlkGAMgASgFIjgKFEwyQl9HYW1lU3RhcnRSZXF1ZXN0EgwKBG5hbWUYASABKAkSEgoKbWF4VXNlck51bRgCIAEoBSJBChlCMkNfR2FtZVN0YXJ0Tm90aWZpY2F0aW9uEiQKCHVzZXJEYXRhGAEgAygLMhIuUHJvdG9jb2wuVXNlckRhdGEiGAoWQzJMX0dldFJvb21MaXN0UmVxdWVzdCI8ChdMMkNfR2V0Um9vbUxpc3RSZXNwb25zZRIhCgVyb29tcxgBIAMoCzISLlByb3RvY29sLlJvb21EYXRhIiUKE0MyTF9Kb2luUm9vbVJlcXVlc3QSDgoGcm9vbUlkGAEgASgFIk8KFEwyQ19Kb2luUm9vbVJlc3BvbnNlEhEKCWlzU3VjY2VzcxgBIAEoCBIkCghyb29tSW5mbxgCIAEoCzISLlByb3RvY29sLlJvb21EYXRhIkAKGEwyQ19Kb2luUm9vbU5vdGlmaWNhdGlvbhIkCghqb2luVXNlchgBIAEoCzISLlByb3RvY29sLlVzZXJEYXRhIiYKFEMyTF9MZWF2ZVJvb21SZXF1ZXN0Eg4KBnJvb21JZBgBIAEoBSIqChVMMkNfTGVhdmVSb29tUmVzcG9uc2USEQoJaXNTdWNjZXNzGAEgASgIIisKGUwyQ19MZWF2ZVJvb21Ob3RpZmljYXRpb24SDgoGdXNlcklkGAEgASgJYgZwcm90bzM", [file_struct]);

/**
 * Describes the message Protocol.C2L_CreateRoomRequest.
 * Use `create(C2L_CreateRoomRequestSchema)` to create a new message.
 */
export const C2L_CreateRoomRequestSchema = /*@__PURE__*/
  messageDesc(file_room, 0);

/**
 * Describes the message Protocol.L2C_CreateRoomResponse.
 * Use `create(L2C_CreateRoomResponseSchema)` to create a new message.
 */
export const L2C_CreateRoomResponseSchema = /*@__PURE__*/
  messageDesc(file_room, 1);

/**
 * Describes the message Protocol.L2B_CreateGameRoomRequest.
 * Use `create(L2B_CreateGameRoomRequestSchema)` to create a new message.
 */
export const L2B_CreateGameRoomRequestSchema = /*@__PURE__*/
  messageDesc(file_room, 2);

/**
 * Describes the message Protocol.B2L_CreateGameRoomRespone.
 * Use `create(B2L_CreateGameRoomResponeSchema)` to create a new message.
 */
export const B2L_CreateGameRoomResponeSchema = /*@__PURE__*/
  messageDesc(file_room, 3);

/**
 * Describes the message Protocol.C2L_GameStart.
 * Use `create(C2L_GameStartSchema)` to create a new message.
 */
export const C2L_GameStartSchema = /*@__PURE__*/
  messageDesc(file_room, 4);

/**
 * Describes the message Protocol.L2C_GameStart.
 * Use `create(L2C_GameStartSchema)` to create a new message.
 */
export const L2C_GameStartSchema = /*@__PURE__*/
  messageDesc(file_room, 5);

/**
 * Describes the message Protocol.L2B_GameStartRequest.
 * Use `create(L2B_GameStartRequestSchema)` to create a new message.
 */
export const L2B_GameStartRequestSchema = /*@__PURE__*/
  messageDesc(file_room, 6);

/**
 * Describes the message Protocol.B2C_GameStartNotification.
 * Use `create(B2C_GameStartNotificationSchema)` to create a new message.
 */
export const B2C_GameStartNotificationSchema = /*@__PURE__*/
  messageDesc(file_room, 7);

/**
 * Describes the message Protocol.C2L_GetRoomListRequest.
 * Use `create(C2L_GetRoomListRequestSchema)` to create a new message.
 */
export const C2L_GetRoomListRequestSchema = /*@__PURE__*/
  messageDesc(file_room, 8);

/**
 * Describes the message Protocol.L2C_GetRoomListResponse.
 * Use `create(L2C_GetRoomListResponseSchema)` to create a new message.
 */
export const L2C_GetRoomListResponseSchema = /*@__PURE__*/
  messageDesc(file_room, 9);

/**
 * Describes the message Protocol.C2L_JoinRoomRequest.
 * Use `create(C2L_JoinRoomRequestSchema)` to create a new message.
 */
export const C2L_JoinRoomRequestSchema = /*@__PURE__*/
  messageDesc(file_room, 10);

/**
 * Describes the message Protocol.L2C_JoinRoomResponse.
 * Use `create(L2C_JoinRoomResponseSchema)` to create a new message.
 */
export const L2C_JoinRoomResponseSchema = /*@__PURE__*/
  messageDesc(file_room, 11);

/**
 * Describes the message Protocol.L2C_JoinRoomNotification.
 * Use `create(L2C_JoinRoomNotificationSchema)` to create a new message.
 */
export const L2C_JoinRoomNotificationSchema = /*@__PURE__*/
  messageDesc(file_room, 12);

/**
 * Describes the message Protocol.C2L_LeaveRoomRequest.
 * Use `create(C2L_LeaveRoomRequestSchema)` to create a new message.
 */
export const C2L_LeaveRoomRequestSchema = /*@__PURE__*/
  messageDesc(file_room, 13);

/**
 * Describes the message Protocol.L2C_LeaveRoomResponse.
 * Use `create(L2C_LeaveRoomResponseSchema)` to create a new message.
 */
export const L2C_LeaveRoomResponseSchema = /*@__PURE__*/
  messageDesc(file_room, 14);

/**
 * Describes the message Protocol.L2C_LeaveRoomNotification.
 * Use `create(L2C_LeaveRoomNotificationSchema)` to create a new message.
 */
export const L2C_LeaveRoomNotificationSchema = /*@__PURE__*/
  messageDesc(file_room, 15);

