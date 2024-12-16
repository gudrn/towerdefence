import { GamePlayer } from '../game/gamePlayer';
import { BattleSession } from 'src/main/session/battleSession';
import { GameRoom } from './gameRoom';
import { assetManager } from 'src/utils/assetManager';
import { PosInfoSchema, SkillDataSchema } from 'src/protocol/struct_pb';
import { create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { B2G_UseSkillNotificationSchema, G2B_UseSkillRequest } from 'src/protocol/skill_pb';
import { B2G_MonsterDeathNotificationSchema, B2G_MonsterHealthUpdateNotificationSchema } from 'src/protocol/monster_pb';
import { B2G_TowerHealthUpdateNotificationSchema } from 'src/protocol/tower_pb';
import { CustomError } from 'ServerCore/utils/error/customError';
import { ErrorCodes } from 'ServerCore/utils/error/errorCodes';
import { AssetSkill } from 'src/utils/interfaces/assetSkill';

export class SkillManager {
  private gameRoom: GameRoom;

  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  /*---------------------------------------------
   [스킬 처리 함수]
   ---------------------------------------------*/
  handleSkill(packet: G2B_UseSkillRequest, session: BattleSession) {
    
    const user = this.gameRoom.users.get(packet.userId);
    if(user == undefined){
      throw new CustomError(ErrorCodes.SERSSION_NOT_FOUND, "유저를 찾지 못했습니다.");
    } 

    if(packet.skill == undefined || packet.skill.skillPos == undefined) {
      throw new CustomError(ErrorCodes.MISSING_FIELDS, "[handleSkill] Skill이 누락됐습니다.");
    }

    user.useCard(packet.cardId, packet.roomId);
    const skillData = assetManager.getSkillsDataByPrefabId(packet.skill.prefabId);
    if (!skillData) return; 

    switch (skillData.prefabId) {
      case 'OrbitalBeam':
        this.handleOrbitalBeam(skillData, packet.skill.skillPos);
        break;
      // case "Molotov Cocktail":
      //   this.handlerMolotovCocktail(skill,skillPos);
      case 'TowerRepair':
        this.handleTowerRepair(skillData, packet.skill.skillPos);
        break;
      // case 'TowerAllRepair':
      //   this.handleTowerAllRepair(skill);
      default:
        return;
    }

    //const notificationBuffer = createUserSkill(session.getId(), prefabId, skillPos.x, skillPos.y);
    const notificationPacket = create(B2G_UseSkillNotificationSchema, {
      roomId: this.gameRoom.id,
      skill: create(SkillDataSchema, {
        prefabId: skillData.prefabId,
        skillPos: create(PosInfoSchema, {
          x: packet.skill.skillPos.x,
          y: packet.skill.skillPos.y
        }),
      }),
      ownerId: packet.userId
    });

    const sendBuffer = PacketUtils.SerializePacket(notificationPacket, B2G_UseSkillNotificationSchema, ePacketId.B2G_UseSkillNotification, 0);
    this.gameRoom.broadcast(sendBuffer);
  }

  /**---------------------------------------------
   * [궤도 폭격 처리]
   * @param {any} skill - 스킬 정보
   * @param {any} skillPos - 스킬 위치
   * @returns {void}
   ---------------------------------------------*/
  private handleOrbitalBeam(skill: AssetSkill, skillPos: any) {
    const monstersInRange = Array.from(this.gameRoom.getMonsters().values()).filter((monster) => {
      const distance = Math.hypot(monster.getPos().x - skillPos.x, monster.getPos().y - skillPos.y);
      return distance <= skill.attackRange;
    });

    this.applyDamageToMonsters(monstersInRange, skill.attackDamage);

    monstersInRange.forEach((monster) => {
      if (monster.hp <= 0) {
        const mopnsterDeathPacket = create(B2G_MonsterDeathNotificationSchema, {
          monsterId: monster.getId(),
          score: monster.score,
          roomId:this.gameRoom.id,
        });
      
        const monsterDeathBuffer = PacketUtils.SerializePacket(
          mopnsterDeathPacket,
          B2G_MonsterDeathNotificationSchema,
          ePacketId.B2G_MonsterDeathNotification,
          0, //수정 부분
        );
        this.gameRoom.broadcast(monsterDeathBuffer);
        // this.gameRoom.addScore(monster.score);
        this.gameRoom.removeObject(monster.getId());
      } else {
        const attackPacket = create(B2G_MonsterHealthUpdateNotificationSchema, {
          monsterId: monster.getId(),
          hp:monster.hp,
          maxHp:monster.maxHp,
          roomId:this.gameRoom.id,
        });
      
        const attackBuffer = PacketUtils.SerializePacket(
          attackPacket,
          B2G_MonsterHealthUpdateNotificationSchema,
          ePacketId.B2G_MonsterHealthUpdateNotification,
          0,
        );
        this.gameRoom.broadcast(attackBuffer);
      }
    });
  }

  /**---------------------------------------------
   * [화염병 처리]
   * @param {any} skill - 스킬 정보
   * @param {any} skillPos - 스킬 위치
   * @returns {void}
   ---------------------------------------------*/
  //  private handlerMolotovCocktail (skill: any, skillPos: any){
    
  //  }

  /**---------------------------------------------
   * [타워 수리 처리]
   * @param {any} skill - 스킬 정보
   * @param {any} skillPos - 스킬 위치
   * @returns {void}
   ---------------------------------------------*/
  private handleTowerRepair(skill: any, skillPos: any) {
    const towerToHeal = Array.from(this.gameRoom.getTowers().entries()).find(
      ([_, tower]) => tower.pos.x === skillPos.x && tower.pos.y === skillPos.y,
    );

    if (towerToHeal) {
      const [key, tower] = towerToHeal;
      tower.hp = Math.min(tower.hp + skill.heal, tower.maxHp);
      const TowerHealPacket = create(B2G_TowerHealthUpdateNotificationSchema, {
        towerId: tower.getId(),
        hp: tower.hp,
        maxHp: tower.maxHp,
        roomId:this.gameRoom.id,
    })

    const TowerHealBuffer = PacketUtils.SerializePacket(
        TowerHealPacket,
        B2G_TowerHealthUpdateNotificationSchema,
        ePacketId.B2G_TowerHealthUpdateNotification,
        0
    )
      this.gameRoom.broadcast(TowerHealBuffer);
    }
  }

  /**---------------------------------------------
   * [모든 타워 수리 처리]
   * @param {any} skill - 스킬 정보
   * @returns {void}
   ---------------------------------------------*/
  // handleTowerAllRepair(skill: any) {
  //   for (const [key, tower] of this.gameRoom.getTowers()) {
  //     tower.hp = Math.min(tower.hp + skill.heal, tower.maxHp);
  //     const towerBuffer = createTowerHealNotificationPacket(key, tower);
  //     this.gameRoom.broadcast(towerBuffer);
  //   }
  // }
  //요거는 나중에 추가될 스킬킬

  /**---------------------------------------------
   * [몬스터에게 데미지 적용]
   * @param {any[]} monsters - 몬스터 배열
   * @param {number} damage - 데미지 양
   * @returns {void}
   ---------------------------------------------*/
  private applyDamageToMonsters(monsters: any[], damage: number) {
    monsters.forEach((monster) => {
      monster.hp -= damage;
      if (monster.hp <= 0) {
        monster.onDeath();
      }
    });
  }
}
