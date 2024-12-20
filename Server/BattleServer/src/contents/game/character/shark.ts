import { GameRoom } from 'src/contents/room/gameRoom';
import { Character } from './character';
import { eCharacterId } from 'ServerCore/utils/characterId';
import { GamePlayer } from '../gamePlayer';
import { gameRoomManager } from 'src/contents/room/gameRoomManager';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { CustomError } from 'ServerCore/utils/error/customError';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import {
  B2G_MonsterDeathNotificationSchema,
  B2G_MonsterHealthUpdateNotificationSchema,
} from 'src/protocol/monster_pb';
import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
import { assetManager } from 'src/utils/assetManager';
export class Shark extends Character {
  private range: number;
  private percentDamage: number;

  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.shark, room, player); // 3초 쿨다운

    const skillData = assetManager.getCharacterData('Shark');
    if (skillData == null) {
      throw new CustomError(ErrorCodes.UNKNOWN_ERROR, '데이터를 불러오지 못했습니다.');
    }
    this.range = skillData.range;
    this.percentDamage = skillData.attackDamage;
  }

  protected override activateAbility(): void {
    // 현재 캐릭터에 연결된 플레이어를 가져옵니다.
    const player: GamePlayer | undefined = this.player;
    if (!player) {
      console.log('플레이어가 없습니다.');
      return;
    }

    console.log('Shark의 고유 능력 발동: 원형 범위 내 몬스터들에게 데미지');

    const monsters = this.getMonstersInRange(this.room, player, this.range);

    let perDamage: number = 0;
    monsters.forEach((monster) => {
      perDamage = Math.floor(monster.maxHp * this.percentDamage);
      monster.onDamaged(perDamage);

      {
        const notificationPacket = create(B2G_MonsterHealthUpdateNotificationSchema, {
          monsterId: monster.getId(),
          hp: perDamage,
          roomId: this.room.id,
        });

        const sendBuffer = PacketUtils.SerializePacket(
          notificationPacket,
          B2G_MonsterHealthUpdateNotificationSchema,
          ePacketId.B2G_MonsterHealthUpdateNotification,
          0,
        );
        this.room.broadcast(sendBuffer);
      }
    });
  }
}
