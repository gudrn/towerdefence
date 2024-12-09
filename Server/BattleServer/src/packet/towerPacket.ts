import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { Tower } from 'src/contents/game/tower';
import { B2C_MonsterHealthUpdateNotificationSchema } from 'src/protocol/monster_pb';
import { PosInfo, TowerDataSchema } from 'src/protocol/struct_pb';
import { B2C_TowerAttackMonsterNotificationSchema, B2C_TowerBuildNotificationSchema, B2C_TowerBuildResponseSchema, B2C_TowerHealthUpdateNotificationSchema } from 'src/protocol/tower_pb';

// 타워 생성
export function createTowerBuildPacket(isSuccess: boolean, sequence: number) {
    const towerBuildPacket = create(B2C_TowerBuildResponseSchema, {
        isSuccess
    })

    const towerBuildbuffer = PacketUtils.SerializePacket(
        towerBuildPacket,
        B2C_TowerBuildResponseSchema,
        ePacketId.B2C_TowerBuildResponse,
        sequence,
      );
      return towerBuildbuffer
}

// 타워 생성 알림
export function createTowerBuildNotificationPacket(tower: {prefabId: string, towerPos: PosInfo}, ownerId: string, sequence: number) {
    const towerBuildNotificationPacket = create(B2C_TowerBuildNotificationSchema, {
        tower: create(TowerDataSchema, {
        prefabId: tower.prefabId,
        towerPos: tower.towerPos,
      }),
      ownerId: ownerId,
    });

    const towerBuildNotificationBuffer = PacketUtils.SerializePacket(
        towerBuildNotificationPacket,
        B2C_TowerBuildNotificationSchema,
        ePacketId.B2C_TowerBuildNotification,
        sequence,
      );

      return towerBuildNotificationBuffer
}

// 타워 힐 알림
export function createTowerHealNotificationPacket(towerId: string, tower: Tower) {
    const TowerHealPacket = create(B2C_TowerHealthUpdateNotificationSchema, {
        towerId: towerId,
        hp: tower.hp,
        maxHp: tower.maxHp
    })

    const TowerHealBuffer = PacketUtils.SerializePacket(
        TowerHealPacket,
        B2C_TowerHealthUpdateNotificationSchema,
        ePacketId.B2C_TowerHealthUpdateNotification,
        0
    )
    return TowerHealBuffer
}

// 타워 공격 모션
export function createTowerAttackMotionPacket (towerId: string, monsterPos: PosInfo, travelTime: number) {
    const towerAttackMotionPacket = create(B2C_TowerAttackMonsterNotificationSchema, {
        towerId: towerId,
        monsterPos: monsterPos,
        travelTime: travelTime,
    });

    const attackMotionBuffer = PacketUtils.SerializePacket(
        towerAttackMotionPacket,
        B2C_TowerAttackMonsterNotificationSchema,
        ePacketId.B2C_TowerAttackMonsterNotification,
        0
    );
    return attackMotionBuffer
}

// 타워 공격 알림
export function createTowerAttackNotificationPacket (monsterId:string, hp: number, maxHp: number) {
    const towerAttackNotificationPacket = create(B2C_MonsterHealthUpdateNotificationSchema, {
        monsterId: monsterId,
        hp: hp,
        maxHp: maxHp
    });

    const towerAttackNotificationBuffer = PacketUtils.SerializePacket(
        towerAttackNotificationPacket,
        B2C_MonsterHealthUpdateNotificationSchema,
        ePacketId.B2C_MonsterHealthUpdateNotification,
        0
    );

    return towerAttackNotificationBuffer
}

