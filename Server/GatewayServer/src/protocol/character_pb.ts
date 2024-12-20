// @generated by protoc-gen-es v2.2.2 with parameter "target=ts"
// @generated from file character.proto (package Protocol, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import type { PosInfo } from "./struct_pb";
import { file_struct } from "./struct_pb";
import { file_enum } from "./enum_pb";
import type { Message } from "@bufbuild/protobuf";

/**
 * Describes the file character.proto.
 */
export const file_character: GenFile = /*@__PURE__*/
  fileDesc("Cg9jaGFyYWN0ZXIucHJvdG8SCFByb3RvY29sIncKH0MyR19QbGF5ZXJQb3NpdGlvblVwZGF0ZVJlcXVlc3QSIgoHcG9zSW5mbxgBIAEoCzIRLlByb3RvY29sLlBvc0luZm8SEQoJcGFyYW1ldGVyGAIgASgJEg0KBXN0YXRlGAMgASgIEg4KBnJvb21JZBgEIAEoBSJ3Ch9HMkJfUGxheWVyUG9zaXRpb25VcGRhdGVSZXF1ZXN0EiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhEKCXBhcmFtZXRlchgCIAEoCRINCgVzdGF0ZRgDIAEoCBIOCgZyb29tSWQYBCABKAUifAokQjJHX1BsYXllclBvc2l0aW9uVXBkYXRlTm90aWZpY2F0aW9uEiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhEKCXBhcmFtZXRlchgCIAEoCRINCgVzdGF0ZRgDIAEoCBIOCgZyb29tSWQYBCABKAUibAokRzJDX1BsYXllclBvc2l0aW9uVXBkYXRlTm90aWZpY2F0aW9uEiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhEKCXBhcmFtZXRlchgCIAEoCRINCgVzdGF0ZRgDIAEoCCJkChtDMkdfUGxheWVyVXNlQWJpbGl0eVJlcXVlc3QSIwoIcG9zaXRpb24YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhAKCHByZWZhYklkGAIgASgJEg4KBnJvb21JZBgDIAEoBSJkChtHMkJfUGxheWVyVXNlQWJpbGl0eVJlcXVlc3QSIwoIcG9zaXRpb24YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhAKCHByZWZhYklkGAIgASgJEg4KBnJvb21JZBgDIAEoBSJ6CiBCMkdfUGxheWVyVXNlQWJpbGl0eU5vdGlmaWNhdGlvbhIjCghwb3NpdGlvbhgBIAEoCzIRLlByb3RvY29sLlBvc0luZm8SEAoIcHJlZmFiSWQYAiABKAkSDwoHbWVzc2FnZRgDIAEoCRIOCgZyb29tSWQYBCABKAUiagogRzJDX1BsYXllclVzZUFiaWxpdHlOb3RpZmljYXRpb24SIwoIcG9zaXRpb24YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhAKCHByZWZhYklkGAIgASgJEg8KB21lc3NhZ2UYAyABKAliBnByb3RvMw", [file_struct, file_enum]);

/**
 * 캐릭터 위치 동기화
 *
 * @generated from message Protocol.C2G_PlayerPositionUpdateRequest
 */
export type C2G_PlayerPositionUpdateRequest = Message<"Protocol.C2G_PlayerPositionUpdateRequest"> & {
  /**
   * @generated from field: Protocol.PosInfo posInfo = 1;
   */
  posInfo?: PosInfo;

  /**
   * @generated from field: string parameter = 2;
   */
  parameter: string;

  /**
   * @generated from field: bool state = 3;
   */
  state: boolean;

  /**
   * @generated from field: int32 roomId = 4;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.C2G_PlayerPositionUpdateRequest.
 * Use `create(C2G_PlayerPositionUpdateRequestSchema)` to create a new message.
 */
export const C2G_PlayerPositionUpdateRequestSchema: GenMessage<C2G_PlayerPositionUpdateRequest> = /*@__PURE__*/
  messageDesc(file_character, 0);

/**
 * @generated from message Protocol.G2B_PlayerPositionUpdateRequest
 */
export type G2B_PlayerPositionUpdateRequest = Message<"Protocol.G2B_PlayerPositionUpdateRequest"> & {
  /**
   * @generated from field: Protocol.PosInfo posInfo = 1;
   */
  posInfo?: PosInfo;

  /**
   * @generated from field: string parameter = 2;
   */
  parameter: string;

  /**
   * @generated from field: bool state = 3;
   */
  state: boolean;

  /**
   * @generated from field: int32 roomId = 4;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.G2B_PlayerPositionUpdateRequest.
 * Use `create(G2B_PlayerPositionUpdateRequestSchema)` to create a new message.
 */
export const G2B_PlayerPositionUpdateRequestSchema: GenMessage<G2B_PlayerPositionUpdateRequest> = /*@__PURE__*/
  messageDesc(file_character, 1);

/**
 * 캐릭터 위치 동기화 알림
 *
 * @generated from message Protocol.B2G_PlayerPositionUpdateNotification
 */
export type B2G_PlayerPositionUpdateNotification = Message<"Protocol.B2G_PlayerPositionUpdateNotification"> & {
  /**
   * @generated from field: Protocol.PosInfo posInfo = 1;
   */
  posInfo?: PosInfo;

  /**
   * @generated from field: string parameter = 2;
   */
  parameter: string;

  /**
   * @generated from field: bool state = 3;
   */
  state: boolean;

  /**
   * @generated from field: int32 roomId = 4;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2G_PlayerPositionUpdateNotification.
 * Use `create(B2G_PlayerPositionUpdateNotificationSchema)` to create a new message.
 */
export const B2G_PlayerPositionUpdateNotificationSchema: GenMessage<B2G_PlayerPositionUpdateNotification> = /*@__PURE__*/
  messageDesc(file_character, 2);

/**
 * 캐릭터 위치 동기화 알림
 *
 * @generated from message Protocol.G2C_PlayerPositionUpdateNotification
 */
export type G2C_PlayerPositionUpdateNotification = Message<"Protocol.G2C_PlayerPositionUpdateNotification"> & {
  /**
   * @generated from field: Protocol.PosInfo posInfo = 1;
   */
  posInfo?: PosInfo;

  /**
   * @generated from field: string parameter = 2;
   */
  parameter: string;

  /**
   * @generated from field: bool state = 3;
   */
  state: boolean;
};

/**
 * Describes the message Protocol.G2C_PlayerPositionUpdateNotification.
 * Use `create(G2C_PlayerPositionUpdateNotificationSchema)` to create a new message.
 */
export const G2C_PlayerPositionUpdateNotificationSchema: GenMessage<G2C_PlayerPositionUpdateNotification> = /*@__PURE__*/
  messageDesc(file_character, 3);

/**
 * GamePlayerData에서 nickname이 불필요해 제거했습니다 - 조정현
 * 이유: 네트워크 부하 감소
 *
 * @generated from message Protocol.C2G_PlayerUseAbilityRequest
 */
export type C2G_PlayerUseAbilityRequest = Message<"Protocol.C2G_PlayerUseAbilityRequest"> & {
  /**
   * @generated from field: Protocol.PosInfo position = 1;
   */
  position?: PosInfo;

  /**
   * @generated from field: string prefabId = 2;
   */
  prefabId: string;

  /**
   * @generated from field: int32 roomId = 3;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.C2G_PlayerUseAbilityRequest.
 * Use `create(C2G_PlayerUseAbilityRequestSchema)` to create a new message.
 */
export const C2G_PlayerUseAbilityRequestSchema: GenMessage<C2G_PlayerUseAbilityRequest> = /*@__PURE__*/
  messageDesc(file_character, 4);

/**
 * @generated from message Protocol.G2B_PlayerUseAbilityRequest
 */
export type G2B_PlayerUseAbilityRequest = Message<"Protocol.G2B_PlayerUseAbilityRequest"> & {
  /**
   * @generated from field: Protocol.PosInfo position = 1;
   */
  position?: PosInfo;

  /**
   * @generated from field: string prefabId = 2;
   */
  prefabId: string;

  /**
   * @generated from field: int32 roomId = 3;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.G2B_PlayerUseAbilityRequest.
 * Use `create(G2B_PlayerUseAbilityRequestSchema)` to create a new message.
 */
export const G2B_PlayerUseAbilityRequestSchema: GenMessage<G2B_PlayerUseAbilityRequest> = /*@__PURE__*/
  messageDesc(file_character, 5);

/**
 * 
 *
 * @generated from message Protocol.B2G_PlayerUseAbilityNotification
 */
export type B2G_PlayerUseAbilityNotification = Message<"Protocol.B2G_PlayerUseAbilityNotification"> & {
  /**
   * @generated from field: Protocol.PosInfo position = 1;
   */
  position?: PosInfo;

  /**
   * @generated from field: string prefabId = 2;
   */
  prefabId: string;

  /**
   * @generated from field: string message = 3;
   */
  message: string;

  /**
   * @generated from field: int32 roomId = 4;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2G_PlayerUseAbilityNotification.
 * Use `create(B2G_PlayerUseAbilityNotificationSchema)` to create a new message.
 */
export const B2G_PlayerUseAbilityNotificationSchema: GenMessage<B2G_PlayerUseAbilityNotification> = /*@__PURE__*/
  messageDesc(file_character, 6);

/**
 * @generated from message Protocol.G2C_PlayerUseAbilityNotification
 */
export type G2C_PlayerUseAbilityNotification = Message<"Protocol.G2C_PlayerUseAbilityNotification"> & {
  /**
   * @generated from field: Protocol.PosInfo position = 1;
   */
  position?: PosInfo;

  /**
   * @generated from field: string prefabId = 2;
   */
  prefabId: string;

  /**
   * @generated from field: string message = 3;
   */
  message: string;
};

/**
 * Describes the message Protocol.G2C_PlayerUseAbilityNotification.
 * Use `create(G2C_PlayerUseAbilityNotificationSchema)` to create a new message.
 */
export const G2C_PlayerUseAbilityNotificationSchema: GenMessage<G2C_PlayerUseAbilityNotification> = /*@__PURE__*/
  messageDesc(file_character, 7);

