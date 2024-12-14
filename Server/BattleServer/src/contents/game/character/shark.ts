import { GameRoom } from 'src/contents/room/gameRoom';
import { Character } from './character';
import { eCharacterId } from 'ServerCore/utils/characterId';
import { GamePlayer } from '../gamePlayer';
import { createDeathMoster, createMosterHpSync } from 'src/packet/gameRoomPacket';
import { gameRoomManager } from 'src/contents/room/gameRoomManager';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { CustomError } from 'ServerCore/utils/error/customError';
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

    this.applyDamageToMonsters(monsters, damage);
    console.log(`몬스터에게 ${damage}의 데미지!`);

    monsters.forEach((monster) => {
      if (monster.hp <= 0) {
        const monsterDeathBuffer = createDeathMoster(monster.getId(), monster.score);
        this.room.broadcast(monsterDeathBuffer);
      } else {
        const attackBuffer = createMosterHpSync(monster.getId(), monster.hp, monster.maxHp);
        this.room.broadcast(attackBuffer);
      }
    });
  }
}
