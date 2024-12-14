import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import {
  B2C_MonsterAttackBaseNotificationSchema,
  B2C_MonsterAttackTowerNotificationSchema,
  B2C_MonsterPositionUpdateNotificationSchema,
  B2C_MonsterBuffNotificationSchema,
  B2C_MonsterSlowEffectNotificationSchema,
} from 'src/protocol/monster_pb';
import { B2C_TowerDestroyNotificationSchema } from 'src/protocol/tower_pb';

export const createUpdateMove = (getPos: () => any) => {
  const packet = create(B2C_MonsterPositionUpdateNotificationSchema, {
    posInfo: getPos(),
  });

  const sendBuffer = PacketUtils.SerializePacket(
    packet,
    B2C_MonsterPositionUpdateNotificationSchema,
    ePacketId.B2C_MonsterPositionUpdateNotification,
    0,
  );

  return sendBuffer;
};

export const createAttackTarget = (
  getId: () => string,
  tower: { getId: () => string; hp: number; maxHp: number },
) => {
  const attackPacket = create(B2C_MonsterAttackTowerNotificationSchema, {
    monsterId: getId(),
    targetId: tower.getId(),
    hp: tower.hp,
    maxHp: tower.maxHp,
  });

  const attackBuffer = PacketUtils.SerializePacket(
    attackPacket,
    B2C_MonsterAttackTowerNotificationSchema,
    ePacketId.B2C_MonsterAttackTowerNotification,
    0,
  );
  return attackBuffer;
};

export const createTowerDestroyed = (tower: { getId: () => string }, isSuccess: boolean = true) => {
  const towerDestroyedPacket = create(B2C_TowerDestroyNotificationSchema, {
    towerId: tower.getId(),
    isSuccess,
  });

  const towerDestroyedBuffer = PacketUtils.SerializePacket(
    towerDestroyedPacket,
    B2C_TowerDestroyNotificationSchema,
    ePacketId.B2C_TowerDestroyNotification,
    0, //수정 부분
  );
  return towerDestroyedBuffer;
};

export const createAttackBase = (getId: () => string, attackDamage: number) => {
  const baseAttackPacket = create(B2C_MonsterAttackBaseNotificationSchema, {
    monsterId: getId(),
    attackDamage: attackDamage,
  });

  const baseAttackBuffer = PacketUtils.SerializePacket(
    baseAttackPacket,
    B2C_MonsterAttackBaseNotificationSchema,
    ePacketId.B2C_MonsterAttackBaseNotification,
    0, //수정 부분
  );
  return baseAttackBuffer;
};

export const createAttackBuff = (buff: string, onoff: boolean) => {
  const createAttackBuffpacket = create(B2C_MonsterBuffNotificationSchema, {
    buffType: buff,
    state: onoff,
  });
  const createAttackBuffBuffer = PacketUtils.SerializePacket(
    createAttackBuffpacket,
    B2C_MonsterBuffNotificationSchema,
    ePacketId.B2C_MonsterBuffNotification,
    0,
  );
  return createAttackBuffBuffer;
};

export const createMonsterSlowEffect = (monsterId: string, isSlowed: boolean) => {
  const createMonsterSlowEffectPacket = create(B2C_MonsterSlowEffectNotificationSchema, {
    monsterId,
    isSlowed,
  });

  const createMonsterSlowEffectBuffer = PacketUtils.SerializePacket(
    createMonsterSlowEffectPacket,
    B2C_MonsterSlowEffectNotificationSchema,
    ePacketId.B2C_MonsterSlowEffectNotification,
    0,
  );  
  return createMonsterSlowEffectBuffer;
};
