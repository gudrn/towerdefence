// @generated by protoc-gen-es v2.2.2 with parameter "target=js"
// @generated from file tower.proto (package Protocol, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc } from '@bufbuild/protobuf/codegenv1';
import { file_struct } from './struct_pb.js';

/**
 * Describes the file tower.proto.
 */
export const file_tower =
  /*@__PURE__*/
  fileDesc(
    'Cgt0b3dlci5wcm90bxIIUHJvdG9jb2wiTAoVQzJCX1Rvd2VyQnVpbGRSZXF1ZXN0EiIKBXRvd2VyGAEgASgLMhMuUHJvdG9jb2wuVG93ZXJEYXRhEg8KB293bmVySWQYAiABKAUiTwoWQjJDX1Rvd2VyQnVpbGRSZXNwb25zZRIRCglpc1N1Y2Nlc3MYASABKAgSIgoFdG93ZXIYAiABKAsyEy5Qcm90b2NvbC5Ub3dlckRhdGEiTwoYQjJDX0FkZFRvd2VyTm90aWZpY2F0aW9uEiIKBXRvd2VyGAEgASgLMhMuUHJvdG9jb2wuVG93ZXJEYXRhEg8KB293bmVySWQYAiABKAUiOwoWQjJDX1Rvd2VyQXR0YWNrUmVxdWVzdBIPCgd0b3dlcklkGAEgASgFEhAKCHRhcmdldElkGAIgASgFIlYKG0IyQ19Ub3dlckF0dGFja05vdGlmaWNhdGlvbhIRCglpc1N1Y2Nlc3MYASABKAgSDgoGZGFtYWdlGAIgASgFEhQKDHRhcmdldEhlYWx0aBgDIAEoBSIqChdDMkJfVG93ZXJEZXN0cm95UmVxdWVzdBIPCgd0b3dlcklkGAEgASgFIisKGEMyQl9Ub3dlckRlc3Ryb3lSZXNwb25zZRIPCgd0b3dlcklkGAEgASgFIi8KHEMyQl9Ub3dlckRlc3Ryb3lOb3RpZmljYXRpb24SDwoHdG93ZXJJZBgBIAEoBWIGcHJvdG8z',
    [file_struct],
  );

/**
 * Describes the message Protocol.C2B_TowerBuildRequest.
 * Use `create(C2B_TowerBuildRequestSchema)` to create a new message.
 */
export const C2B_TowerBuildRequestSchema = /*@__PURE__*/ messageDesc(file_tower, 0);

/**
 * Describes the message Protocol.B2C_TowerBuildResponse.
 * Use `create(B2C_TowerBuildResponseSchema)` to create a new message.
 */
export const B2C_TowerBuildResponseSchema = /*@__PURE__*/ messageDesc(file_tower, 1);

/**
 * Describes the message Protocol.B2C_AddTowerNotification.
 * Use `create(B2C_AddTowerNotificationSchema)` to create a new message.
 */
export const B2C_AddTowerNotificationSchema = /*@__PURE__*/ messageDesc(file_tower, 2);

/**
 * Describes the message Protocol.B2C_TowerAttackRequest.
 * Use `create(B2C_TowerAttackRequestSchema)` to create a new message.
 */
export const B2C_TowerAttackRequestSchema = /*@__PURE__*/ messageDesc(file_tower, 3);

/**
 * Describes the message Protocol.B2C_TowerAttackNotification.
 * Use `create(B2C_TowerAttackNotificationSchema)` to create a new message.
 */
export const B2C_TowerAttackNotificationSchema = /*@__PURE__*/ messageDesc(file_tower, 4);

/**
 * Describes the message Protocol.C2B_TowerDestroyRequest.
 * Use `create(C2B_TowerDestroyRequestSchema)` to create a new message.
 */
export const C2B_TowerDestroyRequestSchema = /*@__PURE__*/ messageDesc(file_tower, 5);

/**
 * Describes the message Protocol.C2B_TowerDestroyResponse.
 * Use `create(C2B_TowerDestroyResponseSchema)` to create a new message.
 */
export const C2B_TowerDestroyResponseSchema = /*@__PURE__*/ messageDesc(file_tower, 6);

/**
 * Describes the message Protocol.C2B_TowerDestroyNotification.
 * Use `create(C2B_TowerDestroyNotificationSchema)` to create a new message.
 */
export const C2B_TowerDestroyNotificationSchema = /*@__PURE__*/ messageDesc(file_tower, 7);
