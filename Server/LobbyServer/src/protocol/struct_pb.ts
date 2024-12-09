// @generated by protoc-gen-es v2.2.2 with parameter "target=ts"
// @generated from file struct.proto (package Protocol, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import { fileDesc, messageDesc } from "@bufbuild/protobuf/codegenv1";
import type { RoomStateType } from "./enum_pb";
import { file_enum } from "./enum_pb";
import type { Message } from "@bufbuild/protobuf";

/**
 * Describes the file struct.proto.
 */
export const file_struct: GenFile = /*@__PURE__*/
  fileDesc("CgxzdHJ1Y3QucHJvdG8SCFByb3RvY29sIiUKCEJhc2VEYXRhEgoKAmhwGAEgASgFEg0KBW1heEhwGAIgASgFIm0KC01vbnN0ZXJEYXRhEhEKCW1vbnN0ZXJJZBgBIAEoBRIVCg1tb25zdGVyTnVtYmVyGAIgASgFEg0KBWxldmVsGAMgASgFEiUKCm1vbnN0ZXJQb3MYBCABKAsyES5Qcm90b2NvbC5Qb3NJbmZvIjYKCFVzZXJEYXRhEgoKAmlkGAEgASgJEgwKBG5hbWUYAiABKAkSEAoIcHJlZmFiSWQYAyABKAkilAEKCFJvb21EYXRhEgoKAmlkGAEgASgFEg8KB293bmVySWQYAiABKAkSDAoEbmFtZRgDIAEoCRISCgptYXhVc2VyTnVtGAQgASgFEiYKBXN0YXRlGAUgASgOMhcuUHJvdG9jb2wuUm9vbVN0YXRlVHlwZRIhCgV1c2VycxgGIAMoCzISLlByb3RvY29sLlVzZXJEYXRhIi0KB1Bvc0luZm8SDAoEdXVpZBgBIAEoCRIJCgF4GAIgASgCEgkKAXkYAyABKAIiWQoOR2FtZVBsYXllckRhdGESIwoIcG9zaXRpb24YASABKAsyES5Qcm90b2NvbC5Qb3NJbmZvEhAKCG5pY2tuYW1lGAIgASgJEhAKCHByZWZhYklkGAMgASgJIjIKCUVycm9yRGF0YRIUCgxyZXNwb25zZUNvZGUYASABKAUSDwoHbWVzc2FnZRgCIAEoCSJCCglUb3dlckRhdGESEAoIcHJlZmFiSWQYASABKAkSIwoIdG93ZXJQb3MYAiABKAsyES5Qcm90b2NvbC5Qb3NJbmZvIkIKCVNraWxsRGF0YRIQCghwcmVmYWJJZBgBIAEoCRIjCghza2lsbFBvcxgCIAEoCzIRLlByb3RvY29sLlBvc0luZm8iLAoIQ2FyZERhdGESDgoGY2FyZElkGAEgASgJEhAKCHByZWZhYklkGAIgASgJIkoKE01vbnN0ZXJIZWFsdGhVcGRhdGUSEQoJbW9uc3RlcklkGAEgASgJEhEKCWN1cnJlbnRIcBgCIAEoBRINCgVtYXhIcBgDIAEoBWIGcHJvdG8z", [file_enum]);

/**
 * @generated from message Protocol.BaseData
 */
export type BaseData = Message<"Protocol.BaseData"> & {
  /**
   * 현재 체력
   *
   * @generated from field: int32 hp = 1;
   */
  hp: number;

  /**
   * 최대 체력
   *
   * @generated from field: int32 maxHp = 2;
   */
  maxHp: number;
};

/**
 * Describes the message Protocol.BaseData.
 * Use `create(BaseDataSchema)` to create a new message.
 */
export const BaseDataSchema: GenMessage<BaseData> = /*@__PURE__*/
  messageDesc(file_struct, 0);

/**
 * @generated from message Protocol.MonsterData
 */
export type MonsterData = Message<"Protocol.MonsterData"> & {
  /**
   * 몬스터 식별 id
   *
   * @generated from field: int32 monsterId = 1;
   */
  monsterId: number;

  /**
   * 몬스터 종류 구분하는 번호
   *
   * @generated from field: int32 monsterNumber = 2;
   */
  monsterNumber: number;

  /**
   * 레벨
   *
   * @generated from field: int32 level = 3;
   */
  level: number;

  /**
   * @generated from field: Protocol.PosInfo monsterPos = 4;
   */
  monsterPos?: PosInfo;
};

/**
 * Describes the message Protocol.MonsterData.
 * Use `create(MonsterDataSchema)` to create a new message.
 */
export const MonsterDataSchema: GenMessage<MonsterData> = /*@__PURE__*/
  messageDesc(file_struct, 1);

/**
 * 변경 주의(클라 의존성)
 *
 * @generated from message Protocol.UserData
 */
export type UserData = Message<"Protocol.UserData"> & {
  /**
   * 유저 식별 id
   *
   * @generated from field: string id = 1;
   */
  id: string;

  /**
   * 닉네임
   *
   * @generated from field: string name = 2;
   */
  name: string;

  /**
   * @generated from field: string prefabId = 3;
   */
  prefabId: string;
};

/**
 * Describes the message Protocol.UserData.
 * Use `create(UserDataSchema)` to create a new message.
 */
export const UserDataSchema: GenMessage<UserData> = /*@__PURE__*/
  messageDesc(file_struct, 2);

/**
 * 변경 주의(클라 의존성)
 *
 * @generated from message Protocol.RoomData
 */
export type RoomData = Message<"Protocol.RoomData"> & {
  /**
   * 방 ID
   *
   * @generated from field: int32 id = 1;
   */
  id: number;

  /**
   * 방 소유자 ID
   *
   * @generated from field: string ownerId = 2;
   */
  ownerId: string;

  /**
   * 방 이름
   *
   * @generated from field: string name = 3;
   */
  name: string;

  /**
   * 최대 사용자 수
   *
   * @generated from field: int32 maxUserNum = 4;
   */
  maxUserNum: number;

  /**
   * 방 상태
   *
   * @generated from field: Protocol.RoomStateType state = 5;
   */
  state: RoomStateType;

  /**
   * 방에 참여하는 사용자 목록
   *
   * @generated from field: repeated Protocol.UserData users = 6;
   */
  users: UserData[];
};

/**
 * Describes the message Protocol.RoomData.
 * Use `create(RoomDataSchema)` to create a new message.
 */
export const RoomDataSchema: GenMessage<RoomData> = /*@__PURE__*/
  messageDesc(file_struct, 3);

/**
 * @generated from message Protocol.PosInfo
 */
export type PosInfo = Message<"Protocol.PosInfo"> & {
  /**
   * @generated from field: string uuid = 1;
   */
  uuid: string;

  /**
   * @generated from field: float x = 2;
   */
  x: number;

  /**
   * @generated from field: float y = 3;
   */
  y: number;
};

/**
 * Describes the message Protocol.PosInfo.
 * Use `create(PosInfoSchema)` to create a new message.
 */
export const PosInfoSchema: GenMessage<PosInfo> = /*@__PURE__*/
  messageDesc(file_struct, 4);

/**
 * @generated from message Protocol.GamePlayerData
 */
export type GamePlayerData = Message<"Protocol.GamePlayerData"> & {
  /**
   * @generated from field: Protocol.PosInfo position = 1;
   */
  position?: PosInfo;

  /**
   * @generated from field: string nickname = 2;
   */
  nickname: string;

  /**
   * @generated from field: string prefabId = 3;
   */
  prefabId: string;
};

/**
 * Describes the message Protocol.GamePlayerData.
 * Use `create(GamePlayerDataSchema)` to create a new message.
 */
export const GamePlayerDataSchema: GenMessage<GamePlayerData> = /*@__PURE__*/
  messageDesc(file_struct, 5);

/**
 * @generated from message Protocol.ErrorData
 */
export type ErrorData = Message<"Protocol.ErrorData"> & {
  /**
   * 에러코드
   *
   * @generated from field: int32 responseCode = 1;
   */
  responseCode: number;

  /**
   * 에러 내용
   *
   * @generated from field: string message = 2;
   */
  message: string;
};

/**
 * Describes the message Protocol.ErrorData.
 * Use `create(ErrorDataSchema)` to create a new message.
 */
export const ErrorDataSchema: GenMessage<ErrorData> = /*@__PURE__*/
  messageDesc(file_struct, 6);

/**
 * @generated from message Protocol.TowerData
 */
export type TowerData = Message<"Protocol.TowerData"> & {
  /**
   * 타워 종류 구분하는 번호
   *
   * @generated from field: string prefabId = 1;
   */
  prefabId: string;

  /**
   * @generated from field: Protocol.PosInfo towerPos = 2;
   */
  towerPos?: PosInfo;
};

/**
 * Describes the message Protocol.TowerData.
 * Use `create(TowerDataSchema)` to create a new message.
 */
export const TowerDataSchema: GenMessage<TowerData> = /*@__PURE__*/
  messageDesc(file_struct, 7);

/**
 * @generated from message Protocol.SkillData
 */
export type SkillData = Message<"Protocol.SkillData"> & {
  /**
   * @generated from field: string prefabId = 1;
   */
  prefabId: string;

  /**
   * @generated from field: Protocol.PosInfo skillPos = 2;
   */
  skillPos?: PosInfo;
};

/**
 * Describes the message Protocol.SkillData.
 * Use `create(SkillDataSchema)` to create a new message.
 */
export const SkillDataSchema: GenMessage<SkillData> = /*@__PURE__*/
  messageDesc(file_struct, 8);

/**
 * @generated from message Protocol.CardData
 */
export type CardData = Message<"Protocol.CardData"> & {
  /**
   * @generated from field: string cardId = 1;
   */
  cardId: string;

  /**
   * @generated from field: string prefabId = 2;
   */
  prefabId: string;
};

/**
 * Describes the message Protocol.CardData.
 * Use `create(CardDataSchema)` to create a new message.
 */
export const CardDataSchema: GenMessage<CardData> = /*@__PURE__*/
  messageDesc(file_struct, 9);

/**
 * @generated from message Protocol.MonsterHealthUpdate
 */
export type MonsterHealthUpdate = Message<"Protocol.MonsterHealthUpdate"> & {
  /**
   * @generated from field: string monsterId = 1;
   */
  monsterId: string;

  /**
   * @generated from field: int32 currentHp = 2;
   */
  currentHp: number;

  /**
   * @generated from field: int32 maxHp = 3;
   */
  maxHp: number;
};

/**
 * Describes the message Protocol.MonsterHealthUpdate.
 * Use `create(MonsterHealthUpdateSchema)` to create a new message.
 */
export const MonsterHealthUpdateSchema: GenMessage<MonsterHealthUpdate> = /*@__PURE__*/
  messageDesc(file_struct, 10);
