import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { Monster } from 'src/contents/game/monster';

import { PosInfoSchema, SkillDataSchema } from 'src/protocol/struct_pb';

import {
  B2C_JoinRoomRequestSchema,
  B2C_GameStartNotificationSchema,
  B2C_GameEndNotificationSchema,
} from 'src/protocol/room_pb';
import { B2C_PlayerPositionUpdateNotificationSchema } from 'src/protocol/character_pb';
import { B2C_UseSkillNotificationSchema } from 'src/protocol/skill_pb';
import {
  B2C_MonsterDeathNotificationSchema,
  B2C_MonsterHealthUpdateNotificationSchema,
  B2C_SpawnMonsterNotificationSchema,
} from 'src/protocol/monster_pb';
import { B2C_increaseWaveNotificationSchema } from 'src/protocol/room_pb';

export function createEnterRoom(sequence: number) {
  const enterRoomPacket = create(B2C_JoinRoomRequestSchema, {
    isSuccess: true,
  });

  const enterRoomBuffer = PacketUtils.SerializePacket(
    enterRoomPacket,
    B2C_JoinRoomRequestSchema,
    ePacketId.B2C_JoinRoomResponse,
    sequence,
  );

  return enterRoomBuffer;
}

export function createGameStart(playerDatas: any[], obstaclePosInfos: any[]) {
  const gameStartPacket = create(B2C_GameStartNotificationSchema, {
    playerDatas,
    obstaclePosInfos,
  });

  const gameStartBuffer = PacketUtils.SerializePacket(
    gameStartPacket,
    B2C_GameStartNotificationSchema,
    ePacketId.B2C_GameStartNotification,
    0,
  );
  return gameStartBuffer;
}

export function createPositionUpdate(
  Id: string,
  x: any,
  y: any,
  parameter: string,
  state: boolean,
) {
  const packet = create(B2C_PlayerPositionUpdateNotificationSchema, {
    posInfo: create(PosInfoSchema, {
      uuid: Id,
      x: x,
      y: y,
    }),
    parameter: parameter,
    state: state,
  });

  const sendBuffer = PacketUtils.SerializePacket(
    packet,
    B2C_PlayerPositionUpdateNotificationSchema,
    ePacketId.B2C_PlayerPositionUpdateNotification,
    0,
  );

  return sendBuffer;
}

export function createUserSkill(uuid: string, prefabId: string, x: number, y: number) {
  const skilldata = create(SkillDataSchema, {
    prefabId: prefabId,
    skillPos: create(PosInfoSchema, {
      x,
      y,
    }),
  });
  //스킬 사용 알림
  const notification = create(B2C_UseSkillNotificationSchema, {
    ownerId: uuid,
    skill: skilldata,
  });

  const notificationBuffer = PacketUtils.SerializePacket(
    notification,
    B2C_UseSkillNotificationSchema,
    ePacketId.B2C_UseSkillNotification,
    0,
  );
  return notificationBuffer;
}

export function createDeathMoster(id: string, score: number) {
  const mopnsterDeathPacket = create(B2C_MonsterDeathNotificationSchema, {
    monsterId: id,
    score: score,
  });

  const monsterDeathBuffer = PacketUtils.SerializePacket(
    mopnsterDeathPacket,
    B2C_MonsterDeathNotificationSchema,
    ePacketId.B2C_MonsterDeathNotification,
    0, //수정 부분
  );
  return monsterDeathBuffer;
}

export function createMosterHpSync(id: string, hp: number, maxHp: number) {
  const attackPacket = create(B2C_MonsterHealthUpdateNotificationSchema, {
    monsterId: id,
    hp,
    maxHp,
  });

  const attackBuffer = PacketUtils.SerializePacket(
    attackPacket,
    B2C_MonsterHealthUpdateNotificationSchema,
    ePacketId.B2C_MonsterHealthUpdateNotification,
    0,
  );
  return attackBuffer;
}

export function createEndGame(isSuccess: boolean = false) {
  const endNotification = create(B2C_GameEndNotificationSchema, {
    isSuccess,
  });
  const endBuffer: Buffer = PacketUtils.SerializePacket(
    endNotification,
    B2C_GameEndNotificationSchema,
    ePacketId.B2C_GameEndNotification,
    0,
  );
  return endBuffer;
}

export function createAddObject(object: Monster) {
  const packet = create(B2C_SpawnMonsterNotificationSchema, {
    posInfo: object.getPos(),
    prefabId: object.getPrefabId(),
  });

  const sendBuffer: Buffer = PacketUtils.SerializePacket(
    packet,
    B2C_SpawnMonsterNotificationSchema,
    ePacketId.B2C_SpawnMonsterNotification,
    0,
  );
  return sendBuffer;
}

export function createIcreaseWave(isSuccess: boolean = true) {
  const increaseWavePacket = create(B2C_increaseWaveNotificationSchema, {
    isSuccess,
  });

  const increaseWaveBuffer = PacketUtils.SerializePacket(
    increaseWavePacket,
    B2C_increaseWaveNotificationSchema,
    ePacketId.B2C_increaseWaveNotification,
    0, //수정 부분
  );
  return increaseWaveBuffer;
}
