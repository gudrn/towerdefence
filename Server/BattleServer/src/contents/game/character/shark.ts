import { GameRoom } from 'src/contents/room/gameRoom';
import { Character } from './character';
import { eCharacterId } from 'ServerCore/utils/characterId';
import { GamePlayer } from '../gamePlayer';
import { gameRoomManager } from 'src/contents/room/gameRoomManager';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { CustomError } from 'ServerCore/utils/error/customError';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { B2G_MonsterDeathNotificationSchema, B2G_MonsterHealthUpdateNotificationSchema } from 'src/protocol/monster_pb';
import { create } from '@bufbuild/protobuf';
import { ePacketId } from 'ServerCore/network/packetId';
export class Shark extends Character {
  constructor(room: GameRoom, player: GamePlayer) {
    super(eCharacterId.shark, room, player); // 3초 쿨다운
  }

  protected override activateAbility(): void {
    // 현재 캐릭터에 연결된 플레이어를 가져옵니다.
    const player: GamePlayer | undefined = this.player;
    if (!player) {
      console.log('플레이어가 없습니다.');
      return;
    }

    console.log('Shark의 고유 능력 발동: 원형 범위 내 몬스터들에게 데미지');

    const range = 5; // 적용 범위 (단위: 거리)
    const damage = 20; // 공격력 값

    const monsters = this.getMonstersInRange(this.room, player, range);

    console.log(monsters);

    this.applyDamageToMonsters(monsters, damage);
    console.log(`몬스터에게 ${damage}의 데미지!`);

    
    monsters.forEach((monster) => {
      //[안건] - 조정현
      //이 부분은 monster의 onDeath에서 처리해줘야 합니다.
      //onDeath는 onDamaged에서 호출합니다.
      if (monster.hp <= 0) {
        const notificationPacket = create(B2G_MonsterDeathNotificationSchema, {
          monsterId: monster.getId(),
          score: monster.score,
        });
      
        const sendBuffer = PacketUtils.SerializePacket(
          notificationPacket,
          B2G_MonsterDeathNotificationSchema,
          ePacketId.B2G_MonsterDeathNotification,
          0, //수정 부분
        );
        this.room.broadcast(sendBuffer);
      } else {
        const notificationPacket = create(B2G_MonsterHealthUpdateNotificationSchema, {
          monsterId: monster.getId(),
          hp: monster.hp,
          maxHp: monster.maxHp,
          roomId: this.room.id
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
