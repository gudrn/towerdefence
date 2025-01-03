// @generated by protoc-gen-es v2.2.2 with parameter "target=ts"
// @generated from file monster.proto (package Protocol, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import type { PosInfo } from "./struct_pb";
import { file_struct } from "./struct_pb";
import type { Message } from "@bufbuild/protobuf";

/**
 * Describes the file monster.proto.
 */
export const file_monster: GenFile = /*@__PURE__*/
  fileDesc("Cg1tb25zdGVyLnByb3RvEghQcm90b2NvbCJzChxCMkdfU3Bhd25Nb25zdGVyTm90aWZpY2F0aW9uEiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhAKCHByZWZhYklkGAIgASgJEg0KBW1heEhwGAMgASgFEg4KBnJvb21JZBgEIAEoBSJjChxHMkNfU3Bhd25Nb25zdGVyTm90aWZpY2F0aW9uEiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhAKCHByZWZhYklkGAIgASgJEg0KBW1heEhwGAMgASgFIlAKHEIyR19Nb25zdGVyRGVhdGhOb3RpZmljYXRpb24SEQoJbW9uc3RlcklkGAEgASgJEg0KBXNjb3JlGAIgASgFEg4KBnJvb21JZBgDIAEoBSJAChxHMkNfTW9uc3RlckRlYXRoTm90aWZpY2F0aW9uEhEKCW1vbnN0ZXJJZBgBIAEoCRINCgVzY29yZRgCIAEoBSJbCiVCMkdfTW9uc3RlclBvc2l0aW9uVXBkYXRlTm90aWZpY2F0aW9uEiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEg4KBnJvb21JZBgCIAEoBSJLCiVHMkNfTW9uc3RlclBvc2l0aW9uVXBkYXRlTm90aWZpY2F0aW9uEiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvImUKIkIyR19Nb25zdGVyQXR0YWNrVG93ZXJOb3RpZmljYXRpb24SEQoJbW9uc3RlcklkGAEgASgJEhAKCHRhcmdldElkGAIgASgJEgoKAmhwGAMgASgFEg4KBnJvb21JZBgEIAEoBSJVCiJHMkNfTW9uc3RlckF0dGFja1Rvd2VyTm90aWZpY2F0aW9uEhEKCW1vbnN0ZXJJZBgBIAEoCRIQCgh0YXJnZXRJZBgCIAEoCRIKCgJocBgDIAEoBSJcCiFCMkdfTW9uc3RlckF0dGFja0Jhc2VOb3RpZmljYXRpb24SEQoJbW9uc3RlcklkGAEgASgJEhQKDGF0dGFja0RhbWFnZRgCIAEoBRIOCgZyb29tSWQYAyABKAUiTAohRzJDX01vbnN0ZXJBdHRhY2tCYXNlTm90aWZpY2F0aW9uEhEKCW1vbnN0ZXJJZBgBIAEoCRIUCgxhdHRhY2tEYW1hZ2UYAiABKAUiVAojQjJHX01vbnN0ZXJIZWFsdGhVcGRhdGVOb3RpZmljYXRpb24SEQoJbW9uc3RlcklkGAEgASgJEgoKAmhwGAIgASgFEg4KBnJvb21JZBgDIAEoBSJECiNHMkNfTW9uc3RlckhlYWx0aFVwZGF0ZU5vdGlmaWNhdGlvbhIRCgltb25zdGVySWQYASABKAkSCgoCaHAYAiABKAViBnByb3RvMw", [file_struct]);

/**
 * 몬스터 생성 알림
 *
 * @generated from message Protocol.B2G_SpawnMonsterNotification
 */
export type B2G_SpawnMonsterNotification = Message<"Protocol.B2G_SpawnMonsterNotification"> & {
  /**
   * @generated from field: Protocol.PosInfo posInfo = 1;
   */
  posInfo?: PosInfo;

  /**
   * @generated from field: string prefabId = 2;
   */
  prefabId: string;

  /**
   * @generated from field: int32 maxHp = 3;
   */
  maxHp: number;

  /**
   * @generated from field: int32 roomId = 4;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2G_SpawnMonsterNotification.
 * Use `create(B2G_SpawnMonsterNotificationSchema)` to create a new message.
 */
export const B2G_SpawnMonsterNotificationSchema: GenMessage<B2G_SpawnMonsterNotification> = /*@__PURE__*/
  messageDesc(file_monster, 0);

/**
 * @generated from message Protocol.G2C_SpawnMonsterNotification
 */
export type G2C_SpawnMonsterNotification = Message<"Protocol.G2C_SpawnMonsterNotification"> & {
  /**
   * @generated from field: Protocol.PosInfo posInfo = 1;
   */
  posInfo?: PosInfo;

  /**
   * @generated from field: string prefabId = 2;
   */
  prefabId: string;

  /**
   * @generated from field: int32 maxHp = 3;
   */
  maxHp: number;
};

/**
 * Describes the message Protocol.G2C_SpawnMonsterNotification.
 * Use `create(G2C_SpawnMonsterNotificationSchema)` to create a new message.
 */
export const G2C_SpawnMonsterNotificationSchema: GenMessage<G2C_SpawnMonsterNotification> = /*@__PURE__*/
  messageDesc(file_monster, 1);

/**
 * 몬스터 사망 알림
 *
 * @generated from message Protocol.B2G_MonsterDeathNotification
 */
export type B2G_MonsterDeathNotification = Message<"Protocol.B2G_MonsterDeathNotification"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: int32 score = 2;
   */
  score: number;

  /**
   * @generated from field: int32 roomId = 3;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2G_MonsterDeathNotification.
 * Use `create(B2G_MonsterDeathNotificationSchema)` to create a new message.
 */
export const B2G_MonsterDeathNotificationSchema: GenMessage<B2G_MonsterDeathNotification> = /*@__PURE__*/
  messageDesc(file_monster, 2);

/**
 * 몬스터 사망 알림
 *
 * @generated from message Protocol.G2C_MonsterDeathNotification
 */
export type G2C_MonsterDeathNotification = Message<"Protocol.G2C_MonsterDeathNotification"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: int32 score = 2;
   */
  score: number;
};

/**
 * Describes the message Protocol.G2C_MonsterDeathNotification.
 * Use `create(G2C_MonsterDeathNotificationSchema)` to create a new message.
 */
export const G2C_MonsterDeathNotificationSchema: GenMessage<G2C_MonsterDeathNotification> = /*@__PURE__*/
  messageDesc(file_monster, 3);

/**
 * 몬스터 위치 동기화
 *
 * @generated from message Protocol.B2G_MonsterPositionUpdateNotification
 */
export type B2G_MonsterPositionUpdateNotification = Message<"Protocol.B2G_MonsterPositionUpdateNotification"> & {
  /**
   * @generated from field: Protocol.PosInfo posInfo = 1;
   */
  posInfo?: PosInfo;

  /**
   * @generated from field: int32 roomId = 2;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2G_MonsterPositionUpdateNotification.
 * Use `create(B2G_MonsterPositionUpdateNotificationSchema)` to create a new message.
 */
export const B2G_MonsterPositionUpdateNotificationSchema: GenMessage<B2G_MonsterPositionUpdateNotification> = /*@__PURE__*/
  messageDesc(file_monster, 4);

/**
 * 몬스터 위치 동기화
 *
 * @generated from message Protocol.G2C_MonsterPositionUpdateNotification
 */
export type G2C_MonsterPositionUpdateNotification = Message<"Protocol.G2C_MonsterPositionUpdateNotification"> & {
  /**
   * @generated from field: Protocol.PosInfo posInfo = 1;
   */
  posInfo?: PosInfo;
};

/**
 * Describes the message Protocol.G2C_MonsterPositionUpdateNotification.
 * Use `create(G2C_MonsterPositionUpdateNotificationSchema)` to create a new message.
 */
export const G2C_MonsterPositionUpdateNotificationSchema: GenMessage<G2C_MonsterPositionUpdateNotification> = /*@__PURE__*/
  messageDesc(file_monster, 5);

/**
 * 몬스터 -> 타워 공격 알림
 *
 * @generated from message Protocol.B2G_MonsterAttackTowerNotification
 */
export type B2G_MonsterAttackTowerNotification = Message<"Protocol.B2G_MonsterAttackTowerNotification"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: string targetId = 2;
   */
  targetId: string;

  /**
   * @generated from field: int32 hp = 3;
   */
  hp: number;

  /**
   * @generated from field: int32 roomId = 4;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2G_MonsterAttackTowerNotification.
 * Use `create(B2G_MonsterAttackTowerNotificationSchema)` to create a new message.
 */
export const B2G_MonsterAttackTowerNotificationSchema: GenMessage<B2G_MonsterAttackTowerNotification> = /*@__PURE__*/
  messageDesc(file_monster, 6);

/**
 * 몬스터 -> 타워 공격 알림
 *
 * @generated from message Protocol.G2C_MonsterAttackTowerNotification
 */
export type G2C_MonsterAttackTowerNotification = Message<"Protocol.G2C_MonsterAttackTowerNotification"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: string targetId = 2;
   */
  targetId: string;

  /**
   * @generated from field: int32 hp = 3;
   */
  hp: number;
};

/**
 * Describes the message Protocol.G2C_MonsterAttackTowerNotification.
 * Use `create(G2C_MonsterAttackTowerNotificationSchema)` to create a new message.
 */
export const G2C_MonsterAttackTowerNotificationSchema: GenMessage<G2C_MonsterAttackTowerNotification> = /*@__PURE__*/
  messageDesc(file_monster, 7);

/**
 * 몬스터 -> 베이스 공격 알림
 *
 * @generated from message Protocol.B2G_MonsterAttackBaseNotification
 */
export type B2G_MonsterAttackBaseNotification = Message<"Protocol.B2G_MonsterAttackBaseNotification"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: int32 attackDamage = 2;
   */
  attackDamage: number;

  /**
   * @generated from field: int32 roomId = 3;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2G_MonsterAttackBaseNotification.
 * Use `create(B2G_MonsterAttackBaseNotificationSchema)` to create a new message.
 */
export const B2G_MonsterAttackBaseNotificationSchema: GenMessage<B2G_MonsterAttackBaseNotification> = /*@__PURE__*/
  messageDesc(file_monster, 8);

/**
 * 몬스터 -> 베이스 공격 알림
 *
 * @generated from message Protocol.G2C_MonsterAttackBaseNotification
 */
export type G2C_MonsterAttackBaseNotification = Message<"Protocol.G2C_MonsterAttackBaseNotification"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: int32 attackDamage = 2;
   */
  attackDamage: number;
};

/**
 * Describes the message Protocol.G2C_MonsterAttackBaseNotification.
 * Use `create(G2C_MonsterAttackBaseNotificationSchema)` to create a new message.
 */
export const G2C_MonsterAttackBaseNotificationSchema: GenMessage<G2C_MonsterAttackBaseNotification> = /*@__PURE__*/
  messageDesc(file_monster, 9);

/**
 * 몬스터 체력 업데이트
 *
 * @generated from message Protocol.B2G_MonsterHealthUpdateNotification
 */
export type B2G_MonsterHealthUpdateNotification = Message<"Protocol.B2G_MonsterHealthUpdateNotification"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: int32 hp = 2;
   */
  hp: number;

  /**
   * @generated from field: int32 roomId = 3;
   */
  roomId: number;
};

/**
 * Describes the message Protocol.B2G_MonsterHealthUpdateNotification.
 * Use `create(B2G_MonsterHealthUpdateNotificationSchema)` to create a new message.
 */
export const B2G_MonsterHealthUpdateNotificationSchema: GenMessage<B2G_MonsterHealthUpdateNotification> = /*@__PURE__*/
  messageDesc(file_monster, 10);

/**
 * 몬스터 체력 업데이트
 *
 * @generated from message Protocol.G2C_MonsterHealthUpdateNotification
 */
export type G2C_MonsterHealthUpdateNotification = Message<"Protocol.G2C_MonsterHealthUpdateNotification"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: int32 hp = 2;
   */
  hp: number;
};

/**
 * Describes the message Protocol.G2C_MonsterHealthUpdateNotification.
 * Use `create(G2C_MonsterHealthUpdateNotificationSchema)` to create a new message.
 */
export const G2C_MonsterHealthUpdateNotificationSchema: GenMessage<G2C_MonsterHealthUpdateNotification> = /*@__PURE__*/
  messageDesc(file_monster, 11);

