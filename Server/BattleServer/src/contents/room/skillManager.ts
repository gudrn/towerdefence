import { GamePlayer } from '../game/gamePlayer';
import { BattleSession } from 'src/main/session/battleSession';
import { GameRoom } from './gameRoom';
import { assetManager } from 'src/utils/assetManager';
import { Tower } from '../game/tower';
import { createUserSkill, createDeathMoster, createMosterHpSync } from 'src/packet/gameRoomPacket';
import { createTowerHealNotificationPacket } from 'src/packet/towerPacket';

export class SkillManager {
  private gameRoom: GameRoom;

  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  /**---------------------------------------------
   * [스킬 처리 함수]
   * @param {any} payload - 스킬 정보
   * @param {BattleSession} session - 플레이어 세션
   * @returns {void}
   ---------------------------------------------*/
  handleSkill(payload: any, session: BattleSession) {
    const { prefabId, skillPos } = payload.skill;
    const user: GamePlayer | undefined = this.gameRoom.users.get(session.getId());

    user?.useCard(payload.cardId);
    const skill = assetManager.getSkillsDataByPrefabId(prefabId);

    if (!skill) return;

    switch (skill.prefabId) {
      case 'OrbitalBeam':
        this.handleOrbitalBeam(skill, skillPos);
        break;
      // case "Molotov Cocktail":
      //   this.handlerMolotovCocktail(skill,skillPos);
      case 'TowerRepair':
        this.handleTowerRepair(skill, skillPos);
        break;
      case "TowerAllRepair": 
        this.handleTowerAllRepair(skill)
      default:
        return;
    }

    const notificationBuffer = createUserSkill(prefabId, skillPos.x, skillPos.y);
    this.gameRoom.broadcast(notificationBuffer);
  }

  /**---------------------------------------------
   * [궤도 폭격 처리]
   * @param {any} skill - 스킬 정보
   * @param {any} skillPos - 스킬 위치
   * @returns {void}
   ---------------------------------------------*/
  private handleOrbitalBeam(skill: any, skillPos: any) {
    const monstersInRange = Array.from(this.gameRoom.getMonsters().values()).filter((monster) => {
      const distance = Math.hypot(monster.getPos().x - skillPos.x, monster.getPos().y - skillPos.y);
      return distance <= skill.attackRange;
    });

    this.applyDamageToMonsters(monstersInRange, skill.attackDamage);

    monstersInRange.forEach((monster) => {
      if (monster.hp <= 0) {
        const monsterDeathBuffer = createDeathMoster(monster.getId(), monster.score);
        this.gameRoom.broadcast(monsterDeathBuffer);
      } else {
        const attackBuffer = createMosterHpSync(monster.getId(), monster.hp, monster.maxHp);
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
      const towerBuffer = createTowerHealNotificationPacket(key, tower);
      this.gameRoom.broadcast(towerBuffer);
    }
  }

  /**---------------------------------------------
   * [타워 수리 처리]
   * @param {any} skill - 스킬 정보
   * @returns {void}
   ---------------------------------------------*/
   handleTowerAllRepair(skill:any){
    for(const [key,tower] of this.gameRoom.getTowers()){
      tower.hp = Math.min(tower.hp+skill.heal, tower.maxHp);
      const towerBuffer = createTowerHealNotificationPacket(key, tower);
      this.gameRoom.broadcast(towerBuffer);
    }
   }

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
