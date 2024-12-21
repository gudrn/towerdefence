import { eCharacterId } from 'ServerCore/utils/characterId';
import { GameRoom } from '../../room/gameRoom';
import { Character } from './character';
import { GamePlayer } from '../gamePlayer';
import { gameRoomManager } from 'src/contents/room/gameRoomManager';
import { create } from '@bufbuild/protobuf';
import { B2G_TowerHealthUpdateNotificationSchema } from 'src/protocol/tower_pb';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { assetManager } from 'src/utils/assetManager';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';

/**
 * 개별 캐릭터 클래스 정의
 */
export class Frog extends Character {
  private range: number;
  private heal: number;

  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.frog, room, player); // 3초 쿨다운

    const skillData = assetManager.getCharacterData("Frog");
    if(skillData == null) {
        throw new CustomError(ErrorCodes.UNKNOWN_ERROR, "데이터를 불러오지 못했습니다.");
    }
    this.range = skillData.range;
    this.heal = skillData.heal;
  }

  protected override activateAbility(): void {
    // 현재 캐릭터에 연결된 플레이어를 가져옵니다.
    const player: GamePlayer | undefined = this.player;
    if (!player) {
      console.log('플레이어가 없습니다.');
      return;
    }

    const towers = this.getTowersInRange(this.room, player, this.range);
    
    towers.forEach((tower) => {
      tower.hp = Math.min(tower.hp + this.heal, tower.maxHp); // 공격력 증가
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
