// @generated by protoc-gen-es v2.2.2 with parameter "target=js"
// @generated from file monster.proto (package Protocol, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc } from '@bufbuild/protobuf/codegenv1';
import { file_struct } from './struct_pb.js';

/**
 * Describes the file monster.proto.
 */
export const file_monster =
  /*@__PURE__*/
  fileDesc(
    'Cg1tb25zdGVyLnByb3RvEghQcm90b2NvbCJUChxCMkNfU3Bhd25Nb25zdGVyTm90aWZpY2F0aW9uEiIKB3Bvc0luZm8YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhAKCHByZWZhYklkGAIgASgJIjEKHEIyQ19Nb25zdGVyRGVhdGhOb3RpZmljYXRpb24SEQoJbW9uc3RlcklkGAEgASgJIksKJUIyQ19Nb25zdGVyUG9zaXRpb25VcGRhdGVOb3RpZmljYXRpb24SIgoHcG9zSW5mbxgBIAEoCzIRLlByb3RvY29sLlBvc0luZm8iXwoiQjJDX01vbnN0ZXJBdHRhY2tUb3dlck5vdGlmaWNhdGlvbhIRCgltb25zdGVySWQYASABKAkSEAoIdGFyZ2V0SWQYAiABKAkSFAoMYXR0YWNrRGFtYWdlGAMgASgFIkwKIUIyQ19Nb25zdGVyQXR0YWNrQmFzZU5vdGlmaWNhdGlvbhIRCgltb25zdGVySWQYASABKAkSFAoMYXR0YWNrRGFtYWdlGAIgASgFIlsKI0IyQ19Nb25zdGVySGVhbHRoVXBkYXRlTm90aWZpY2F0aW9uEjQKDWhlYWx0aFVwZGF0ZXMYASADKAsyHS5Qcm90b2NvbC5Nb25zdGVySGVhbHRoVXBkYXRlYgZwcm90bzM',
    [file_struct],
  );

/**
 * Describes the message Protocol.B2C_SpawnMonsterNotification.
 * Use `create(B2C_SpawnMonsterNotificationSchema)` to create a new message.
 */
export const B2C_SpawnMonsterNotificationSchema = /*@__PURE__*/ messageDesc(file_monster, 0);

/**
 * Describes the message Protocol.B2C_MonsterDeathNotification.
 * Use `create(B2C_MonsterDeathNotificationSchema)` to create a new message.
 */
export const B2C_MonsterDeathNotificationSchema = /*@__PURE__*/ messageDesc(file_monster, 1);

/**
 * Describes the message Protocol.B2C_MonsterPositionUpdateNotification.
 * Use `create(B2C_MonsterPositionUpdateNotificationSchema)` to create a new message.
 */
export const B2C_MonsterPositionUpdateNotificationSchema =
  /*@__PURE__*/
  messageDesc(file_monster, 2);

/**
 * Describes the message Protocol.B2C_MonsterAttackTowerNotification.
 * Use `create(B2C_MonsterAttackTowerNotificationSchema)` to create a new message.
 */
export const B2C_MonsterAttackTowerNotificationSchema = /*@__PURE__*/ messageDesc(file_monster, 3);

/**
 * Describes the message Protocol.B2C_MonsterAttackBaseNotification.
 * Use `create(B2C_MonsterAttackBaseNotificationSchema)` to create a new message.
 */
export const B2C_MonsterAttackBaseNotificationSchema = /*@__PURE__*/ messageDesc(file_monster, 4);

/**
 * Describes the message Protocol.B2C_MonsterHealthUpdateNotification.
 * Use `create(B2C_MonsterHealthUpdateNotificationSchema)` to create a new message.
 */
export const B2C_MonsterHealthUpdateNotificationSchema = /*@__PURE__*/ messageDesc(file_monster, 5);
