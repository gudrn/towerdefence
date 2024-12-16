import { eCharacterId } from 'ServerCore/utils/characterId';
import { GameRoom } from '../../room/gameRoom';
import { Character } from './character';
import { GamePlayer } from '../gamePlayer';
import { gameRoomManager } from 'src/contents/room/gameRoomManager';
import { create } from '@bufbuild/protobuf';
import { B2G_TowerHealthUpdateNotificationSchema } from 'src/protocol/tower_pb';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';

/**
 * 개별 캐릭터 클래스 정의
 */
export class Frog extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.frog, room, player); // 3초 쿨다운
  }

  protected override activateAbility(): void {
    // 현재 캐릭터에 연결된 플레이어를 가져옵니다.
    const player: GamePlayer | undefined = this.player;
    if (!player) {
      console.log('플레이어가 없습니다.');
      return;
    }

    console.log('frog의 고유 능력 발동: 원형 범위 내 타워 체력 회복');

    const range = 5; // 버프 적용 범위 (단위: 거리)
    const heal = 20; // 회복할 체력 값

    console.log('플레이어 위치');
    console.log(player.playerData.position);

    const towers = this.getTowersInRange(this.room, player, range);
    console.log('타워 목록');
    console.log(towers);
    
    towers.forEach((tower) => {
      tower.hp = Math.min(tower.hp + heal, tower.maxHp); // 공격력 증가
      console.log(`${tower.getPrefabId()} 타워 체력을 ${heal} 회복했습니다.`);
      const towerId = tower.getId();

      const TowerHealPacket = create(B2G_TowerHealthUpdateNotificationSchema, {
        towerId: towerId,
        hp: tower.hp,
        maxHp: tower.maxHp,
        roomId: this.room.id
      });
    
      const sendBuffer = PacketUtils.SerializePacket(
        TowerHealPacket,
        B2G_TowerHealthUpdateNotificationSchema,
        ePacketId.B2G_TowerHealthUpdateNotification,
        0,
      );

      this.room.broadcast(sendBuffer);
    });
  }
}
