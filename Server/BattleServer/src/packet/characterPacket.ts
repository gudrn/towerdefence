import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId.js';
import { PacketUtils } from 'ServerCore/utils/packetUtils.js';
import { PosInfo } from 'src/protocol/struct_pb.js';

export const createAttackCoolDownBuffNotification = (
  tower: { getId: () => string; attackCoolDown: number },
  attackCoolDownBuff: number,
  isBuffActive: boolean,
) => {
  const attackCoolDownBuffNotificationPacket = create(B2C_AttackCoolDownBuffNotificationSchema, {
    towerId: tower.getId(),
    buffAttackCoolDown: isBuffActive
      ? tower.attackCoolDown
      : tower.attackCoolDown - attackCoolDownBuff,
    buffActive: isBuffActive,
  });

  const attackCoolDownBuffNotificationBuffer = PacketUtils.SerializePacket(
    attackCoolDownBuffNotificationPacket,
    B2C_AttackCoolDownBuffNotificationSchema,
    ePacketId.B2C_AttackCoolDownBuffNotification,
    0,
  );
  return attackCoolDownBuffNotificationBuffer;
};

/**
 * 캐릭터 생성 응답 패킷 생성 함수
 * @param {string} prefabId - 생성된 캐릭터의 ID
 * @param {number} cooldown - 남은 쿨다운
 */
export const createCooldownNotification = (
  prefabId: string, // 캐릭터 ID
  cooldown: number, // 남은 쿨다운 시간 (초 단위)
  getNextSequence: () => number,
) => {
  const cooldownNotificationPacket = create(B2C_CooldownNotificationSchema, {
    prefabId,
    cooldown,
  });

  const cooldownNotificationPacketBuffer = PacketUtils.SerializePacket(
    cooldownNotificationPacket,
    B2C_CooldownNotificationSchema,
    ePacketId.B2C_CooldownNotificationPacket,
    getNextSequence(),
  );
  return cooldownNotificationPacketBuffer;
};

/**
 * 캐릭터 생성 응답 패킷 생성 함수
 * @param {boolean} isSuccess - 캐릭터 생성 성공 여부
 * @param {string} prefabId - 생성된 캐릭터의 ID
 */
export const createCharacterSelectResponse = (
  isSuccess: boolean,
  prefabId: string,
  getNextSequence: () => number,
) => {
  // 1. 패킷 데이터를 생성
  const characterResponsePacket = create(B2C_CharacterSelectResponseSchema, {
    status: isSuccess ? 'success' : 'fail', // 성공 여부를 문자열로 변환
    prefabId, // 캐릭터 ID
  });

  // 2. 패킷 데이터를 직렬화하여 버퍼로 변환
  const characterResponseBuffer = PacketUtils.SerializePacket(
    characterResponsePacket,
    B2C_CharacterSelectResponseSchema,
    ePacketId.B2C_CharacterSelectResponse,
    getNextSequence(),
  );

  // 3. 직렬화된 패킷 버퍼 반환
  return characterResponseBuffer;
};

/**
 * [플레이어 어빌리티 발동 알림 패킷 생성]
 * @param {PosInfo} position - 어빌리티를 발동한 플레이어 ID
 * @param {string} prefabId - 발동한 캐릭터 ID
 * @param {string} message - 보낼 메세지
 * @returns {Buffer} 어빌리티 발동 알림 패킷
 */
export const createPlayerUseAbility = (
  position: PosInfo,
  prefabId: string,
  message: string, // 어빌리티 발동 메세지 내용
  getNextSequence: () => number,
) => {
  const playerUseAbilityPacket = create(B2C_PlayerUseAbilitySchema, {
    position,
    prefabId,
    message,
  });

  const playerUseAbilitybuffer = PacketUtils.SerializePacket(
    playerUseAbilityPacket,
    B2C_PlayerUseAbilitySchema,
    ePacketId.B2C_PlayerUseAbility,
    getNextSequence(),
  );

  return playerUseAbilitybuffer; // 바이너리 데이터로 변환
};
