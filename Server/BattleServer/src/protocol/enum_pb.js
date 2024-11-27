// @generated by protoc-gen-es v2.2.2 with parameter "target=js"
// @generated from file enum.proto (package Protocol, syntax proto3)
/* eslint-disable */

import { enumDesc, fileDesc, tsEnum } from '@bufbuild/protobuf/codegenv1';

/**
 * Describes the file enum.proto.
 */
export const file_enum =
  /*@__PURE__*/
  fileDesc(
    'CgplbnVtLnByb3RvEghQcm90b2NvbCozCg1Sb29tU3RhdGVUeXBlEggKBFdBSVQQABILCgdQUkVQQVJFEAESCwoHSU5BR0FNRRACKkkKCk9iamVjdFR5cGUSCQoFVE9XRVIQABIKCgZQTEFZRVIQARILCgdNT05TVEVSEAISDgoKUFJPSkVDVElMRRADEgcKA0VOVhAEKjIKCENhcmRUeXBlEhAKDEFUVEFDS19UT1dFUhAAEhQKEFNUUl9BVFRBQ0tfVE9XRVIQASqAAQoNQ2hhcmFjdGVyVHlwZRIRCg1Ob25lQ2hhcmFjdGVyEAASBwoDUmVkEAESCQoFU2hhcmsQAxIKCgZNYWxhbmcQBRIKCgZGcm9nZ3kQBxILCgdCb21iTWFuEAgSCwoHU2xvd01hbhAJEggKBE1hc2sQChIMCghEaW5vc291chAMYgZwcm90bzM',
  );

/**
 * Describes the enum Protocol.RoomStateType.
 */
export const RoomStateTypeSchema = /*@__PURE__*/ enumDesc(file_enum, 0);

/**
 * 변경 주의(클라 의존성)
 *
 * @generated from enum Protocol.RoomStateType
 */
export const RoomStateType = /*@__PURE__*/ tsEnum(RoomStateTypeSchema);

/**
 * Describes the enum Protocol.ObjectType.
 */
export const ObjectTypeSchema = /*@__PURE__*/ enumDesc(file_enum, 1);

/**
 * @generated from enum Protocol.ObjectType
 */
export const ObjectType = /*@__PURE__*/ tsEnum(ObjectTypeSchema);

/**
 * Describes the enum Protocol.CardType.
 */
export const CardTypeSchema = /*@__PURE__*/ enumDesc(file_enum, 2);

/**
 * @generated from enum Protocol.CardType
 */
export const CardType = /*@__PURE__*/ tsEnum(CardTypeSchema);

/**
 * Describes the enum Protocol.CharacterType.
 */
export const CharacterTypeSchema = /*@__PURE__*/ enumDesc(file_enum, 3);

/**
 * 캐릭터 타입, 변경 주의(클라 의존성)
 *
 * @generated from enum Protocol.CharacterType
 */
export const CharacterType = /*@__PURE__*/ tsEnum(CharacterTypeSchema);
