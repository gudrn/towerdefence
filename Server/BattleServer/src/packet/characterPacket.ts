import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { B2C_PlayerUseAbilityNotificationSchema } from 'src/protocol/character_pb';
import { PosInfo } from 'src/protocol/struct_pb';

// export const createAttackCoolDownBuffNotification = (
//   towers: { getId: () => string; attackCoolDown: number }[],
//   attackCoolDownBuff: number,
//   isBuffActive: boolean,
// ) => {
//   const towerAttackSpeedBuffNotificationPacket = create(
//     B2C_TowerAttackSpeedBuffNotificationSchema,
//     {
//       towerId: towers.map((tower) => tower.getId()),
//       buffAttackCoolDown: isBuffActive
//         ? towers[0].attackCoolDown
//         : towers[0].attackCoolDown + attackCoolDownBuff,
//       buffActive: isBuffActive,
//     },
//   );

//   const towerAttackSpeedBuffNotificatioBuffer = PacketUtils.SerializePacket(
//     towerAttackSpeedBuffNotificationPacket,
//     B2C_TowerAttackSpeedBuffNotificationSchema,
//     ePacketId.B2C_TowerAttackSpeedBuffNotification,
//     0,
//   );
//   return towerAttackSpeedBuffNotificatioBuffer;
// };

/**
 * 캐릭터 생성 응답 패킷 생성 함수
 * @param {string} prefabId - 생성된 캐릭터의 ID
 * @param {number} cooldown - 남은 쿨다운
 */
// export const createCooldownNotification = (
//   prefabId: string, // 캐릭터 ID
//   cooldown: number, // 남은 쿨다운 시간 (초 단위)
//   getNextSequence: () => number,
// ) => {
//   const cooldownNotificationPacket = create(B2C_CooldownNotificationSchema, {
//     prefabId,
//     cooldown,
//   });

//   const cooldownNotificationPacketBuffer = PacketUtils.SerializePacket(
//     cooldownNotificationPacket,
//     B2C_CooldownNotificationSchema,
//     ePacketId.B2C_CooldownNotificationPacket,
//     getNextSequence(),
//   );
//   return cooldownNotificationPacketBuffer;
// };

/**
 * [플레이어 어빌리티 발동 알림 패킷 생성]
 * @param {PosInfo} position - 어빌리티를 발동한 플레이어 ID
 * @param {string} prefabId - 발동한 캐릭터 ID
 * @param {string} message - 보낼 메세지
 * @returns {Buffer} 어빌리티 발동 알림 패킷
 */
export const createPlayerUseAbilityNotification = (
  position: PosInfo,
  prefabId: string,
  message: string, // 어빌리티 발동 메세지 내용
  getNextSequence: () => number,
) => {
  const playerUseAbilityNotificationPacket = create(B2C_PlayerUseAbilityNotificationSchema, {
    position,
    prefabId,
    message,
  });

  const playerUseAbilityNotificationbuffer = PacketUtils.SerializePacket(
    playerUseAbilityNotificationPacket,
    B2C_PlayerUseAbilityNotificationSchema,
    ePacketId.B2C_PlayerUseAbilityNotification,
    getNextSequence(),
  );

  return playerUseAbilityNotificationbuffer; // 바이너리 데이터로 변환
};
