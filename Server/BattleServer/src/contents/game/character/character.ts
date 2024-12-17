import { GameRoom } from '../../room/gameRoom';
import { GamePlayer } from '../gamePlayer';
import { Tower } from '../towers/tower';
import { BattleSession } from 'src/main/session/battleSession';
import { assetManager } from 'src/utils/assetManager';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import {
  B2G_PlayerUseAbilityNotificationSchema,
  C2G_PlayerUseAbilityRequest,
  G2B_PlayerUseAbilityRequest,
} from 'src/protocol/character_pb';
import { create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { Monster } from '../monsters/monster';
/**
 * 캐릭터 클래스입니다.
 */

//캐릭터의 생성자에서는 prefabId...GamePlayer까지지
export abstract class Character {
  public prefabId: string;
  public cooldown: number = -1; // 능력 카드의 쿨다운 시간 (초 단위)
  private isCooldownActive: boolean = false;
  public player: GamePlayer; // 플레이어 참조 추가
  public room: GameRoom;

  //constructor(prefabId: string, cooldown: number, player: GamePlayer) {
  constructor(prefabId: string, room: GameRoom, player: GamePlayer) {
    this.prefabId = prefabId;
    this.player = player; // 전달받은 GamePlayer를 저장
    this.room = room;
    const characterData = assetManager.getCharacterData(prefabId);
    if (characterData == null) {
      console.log('[Character constructor] 유효하지 않은 prefabId');
      return;
    }

    this.cooldown = characterData.cooldown;
  }

  /**
   * 고유 능력 사용
   * - 쿨다운 상태라면 사용 불가
   */
  public useAbility() {
    if (this.isCooldownActive) {
      console.log(`${this.prefabId}의 능력은 재사용 대기 중입니다.`);
      return;

      // // 쿨다운 상태를 알리는 패킷 생성 및 전송
      // const cooldownNotificationPacketBuffer = createCooldownNotification(
      //   payload.prefabId,
      //   this.cooldown,
      //   session.getNextSequence.bind(this),
      // );
      // this.player.session.send(cooldownNotificationPacketBuffer);
      // return;
    }

    // 능력 발동 로직
    console.log(`${this.prefabId}의 고유 능력을 발동합니다.`);
    this.activateAbility();

    if (this.player.playerData.position == undefined) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, '대충 이유');
    }

    const notificationPacket = create(B2G_PlayerUseAbilityNotificationSchema, {
      position: this.player.playerData.position,
      prefabId: this.player.playerData.prefabId,
      message: `${this.prefabId}의 고유 능력을 발동합니다.`,
      roomId: this.room.id,
    });

    const sendBuffer = PacketUtils.SerializePacket(
      notificationPacket,
      B2G_PlayerUseAbilityNotificationSchema,
      ePacketId.B2G_PlayerUseAbilityNotification,
      0,
    );
    this.room.broadcast(sendBuffer);
    // 쿨다운 시작
    this.startCooldown();
  }

  /**
   * 고유 능력 발동 (상속받는 캐릭터 클래스에서 구현 가능)
   */
  protected abstract activateAbility(): void;

  /**
   * 쿨다운 시작
   */
  private startCooldown() {
    this.isCooldownActive = true;
    setTimeout(() => {
      this.isCooldownActive = false;
      console.log(`${this.prefabId}의 능력이 다시 사용 가능합니다.`);
    }, this.cooldown); // 초 단위 쿨다운 설정
  }

  /**
   * 특정 범위 내에 있는 타워를 가져오는 메서드
   * @param room 게임 방
   * @param player 기준이 되는 플레이어
   * @param range 버프 적용 범위
   * @returns 범위 내 타워 목록
   */
  protected getTowersInRange(room: GameRoom, player: GamePlayer, range: number): Tower[] {
    const towers = Array.from(room.getTowers().values()); // 모든 타워 가져오기
    const playerPos = player.playerData.position; // 플레이어의 위치 가져오기 (캐릭터 기준)

    if (!playerPos) {
      console.log('플레이어 위치를 가져올 수 없습니다.');
      return [];
    }

    return towers.filter((tower) => {
      const distance = Math.sqrt(
        Math.pow(tower.pos.x - playerPos.x, 2) + Math.pow(tower.pos.y - playerPos.y, 2),
      );
      return distance <= range; // 범위 내 타워 필터링
    });
  }

  /**
   * 특정 범위 내에 있는 타워를 가져오는 메서드
   * @param room 게임 방
   * @param player 기준이 되는 플레이어
   * @param range 버프 적용 범위
   * @returns 범위 내 타워 목록
   */
  protected getMonstersInRange(room: GameRoom, player: GamePlayer, range: number){
    const monsters = Array.from(room.getMonsters().values()); // 모든 타워 가져오기
    //console.log(monsters);
    const playerPos = player.playerData.position; // 플레이어의 위치 가져오기 (캐릭터 기준)
    console.log(playerPos);
    if (!playerPos) {
      console.log('플레이어 위치를 가져올 수 없습니다.');
      return [];
    }

    return monsters.filter((monster) => {
      const distance = Math.sqrt(
        Math.pow(monster.pos.x - playerPos.x, 2) + Math.pow(monster.pos.y - playerPos.y, 2),
      );
      return distance <= range; // 범위 내 타워 필터링
    });
  }

  /**---------------------------------------------
   * [몬스터에게 데미지 적용]
   * @param {Monster[]} monsters - 몬스터 배열
   * @param {number} damage - 데미지 양
   * @returns {void}
   ---------------------------------------------*/
  protected applyDamageToMonsters(monsters: Monster[], damage: number) {
    monsters.forEach((monster) => {
      monster.onDamaged(damage); //조정현
      // monster.hp -= damage;
      // if (monster.hp <= 0) {
      //   monster.onDeath();
      // }
    });
  }
}
