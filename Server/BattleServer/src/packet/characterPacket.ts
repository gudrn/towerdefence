import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId.js';
import { PacketUtils } from 'ServerCore/utils/packetUtils.js';

export const createAttackDamageBuffNotificationPacket(
  tower: { getId: () => string; attackDamage: number },
  attackBuff: number,
  isBuffActive: boolean,
  getNextSequence: () => number,
) => {
  const attackDamageBuffNotificationPacket = create(B2C_AttackDamageBuffNotificationPacketSchema, {
    towerId: tower.getId(),
    buffAttackDamage: isBuffActive ? tower.attackDamage : tower.attackDamage - attackBuff,
    buffActive: isBuffActive,
  });

  const attackDamageBuffNotificationBuffer = PacketUtils.SerializePacket(
    attackDamageBuffNotificationPacket,
    B2C_AttackDamageBuffNotificationPacketSchema,
    ePacketId.B2C_AttackDamageBuffNotificationPacket,
    getNextSequence(),
  );
  return attackDamageBuffNotificationBuffer;
}

/**
 * 캐릭터 생성 응답 패킷 생성 함수
 * @param {boolean} isSuccess - 캐릭터 생성 성공 여부
 * @param {string} prefabId - 생성된 캐릭터의 ID
 */
export const createCharacterSelectResponse = (
    isSuccess: boolean,
    prefabId: string,
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
        0
    );

    // 3. 직렬화된 패킷 버퍼 반환
    return characterResponseBuffer;
};
