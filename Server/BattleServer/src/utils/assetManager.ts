import { ParseUtils } from "./parseUtils";
import { v4 as uuidv4 } from "uuid";
import { CardDataSchema } from "src/protocol/struct_pb";
import { create } from "@bufbuild/protobuf";
import { AssetMonster } from "./interfaces/assetMonster";
import { AssetTower } from "./interfaces/assetTower";

interface CardData {
  cardId: string;
  prefabId: string;
}

interface Monster {
  prefabId: string;
  maxHp: number;
  attackRange: number;
  attackDamage: number;
  attackCoolDown: number;
  moveSpeed: number;
  score: number;
}

interface Skill {
  prefabId: string;       // 스킬의 고유 ID
  type: "Attack" | "heal"; // 스킬 유형: "Attack" 또는 "heal"
  attackDamage: number;   // 공격력 (Attack 타입일 때만 있음)
  attackRange: number;    // 공격 범위 (Attack 타입일 때만 있음)
  heal: number;           // 회복량 (heal 타입일 때만 있음)
}

interface Tower {
  prefabId: string;         // 타워의 고유 ID
  attackDamage: number;     // 공격력
  attackRange: number;      // 공격 범위
  attackCoolDown: number;   // 공격 쿨다운 시간 (ms)
  maxHp: number;            // 최대 체력
}

/**
 * ---------------------------------------------
 * ServerAssetManager
 *
 * - 목적: game asset을 중앙에서 관리하기 위함
 * - 장점: 유지 보수 용이
 * ---------------------------------------------
 */
class AssetManager {
  private monsters:Map<string,AssetMonster>;
  private towers:Map<string,AssetTower>;
  private skills:Map<string , Skill>

 
  private cards:Map<string, CardData>
  private towerPrefabIdCaches: Array<string>;
  private skillPrefabIdCaches: Array<string>;

  constructor() {
    this.monsters = new Map<string, AssetMonster>();
    this.towers = new Map<string, AssetTower>();
    this.skills = new Map();

    this.cards = new Map();

    this.towerPrefabIdCaches = new Array<string>();
    this.skillPrefabIdCaches = new Array<string>();
  }

/*---------------------------------------------
    [게임 에셋 불러오기]
---------------------------------------------*/
  async loadGameAssets() {
    try {
      const [monsters, towers, skills] = await Promise.all([
        ParseUtils.readFileAsync('monsters.json'),
        ParseUtils.readFileAsync('towers.json'),
        ParseUtils.readFileAsync('skills.json'),
      ]);

      //몬스터 자원 로드
      this.monsters = new Map(
        monsters.data.map((monster: AssetMonster) => [monster.prefabId, monster]) // prefabId를 키로 사용
      );

      //타워 자원 로드
      this.towers = new Map(
        towers.data.map((tower: AssetTower) => [tower.prefabId, tower]) // prefabId를 키로 사용
      );
    //타워 자원 로드2
    this.towerPrefabIdCaches = towers.data.map((tower: AssetTower) => tower.prefabId);


      //스킬 자원 로드
      this.skills = new Map(
        skills.data.map((skill:Skill) => [skill.prefabId, skill]) // prefabId를 키로 사용
      );
      //스킬 자원 로드2
      this.skillPrefabIdCaches = skills.data.map((skill:Skill) => skill.prefabId);

      if (!this.monsters || this.towers.size === 0) throw new Error('asset is null');

      return {
        monsters: Array.from(this.monsters.values()),
        towers: Array.from(this.towers.values()), // Map 데이터를 배열로 변환
        cards: Array.from(this.cards.values()), // Map 데이터를 배열로 변환
      };
    } catch (error) {
      console.log(error);
      throw new Error('Failed to load game assets');
    }
  }

  /**
   * ---------------------------------------------
   * [getGameAssets]
   * - 클라이언트 접속 시 전달하기 위함
   * ---------------------------------------------
   * @returns {{monsters: Array<Object>}} 게임 에셋
   */
  getGameAssets() {
    return {
      monsters: this.monsters,
      towers: this.towers,
      cards: this.cards,
    };
  }

  /*---------------------------------------------
    [getMonsterData]
      - 특정 몬스터의 데이터를 가져옵니다.
---------------------------------------------*/
  getMonsterData(prefabId: string): AssetMonster | null {
    let monster = this.monsters.get(prefabId) || null;
    
    console.log('monster 정보');
    console.log(monster);
    return monster;
  }

  /**
   * ---------------------------------------------
   * [getRandomAssetMonster]
   * - 랜덤 몬스터 데이터를 가져옵니다.
   * ---------------------------------------------
   * @returns {Object} 랜덤 몬스터 데이터
   */
  getRandomAssetMonster() {
    const monstersArray = Array.from(this.monsters.values());
    console.log('----------');
    console.log(this.monsters.get('Robot1'));
    console.log('----------');
    const random = Math.floor(Math.random() * monstersArray.length);
    return monstersArray[random];
  }

  /**
   * ---------------------------------------------
   * [getTowerData]
   * - 특정 타워의 데이터를 가져옵니다.
   * ---------------------------------------------
   * @param {string} prefabId 타워 prefabId
   * @returns {Object|null} 해당 타워 데이터 또는 null
   */
  getTowerData(prefabId:string) {
    let tower = this.towers.get(prefabId) || null; // Map의 get() 메서드 사용
    console.log('tower정보');
    console.log(tower);
    return tower;
  }

  /**
   * ---------------------------------------------
   * [getCardDataByPrefabId]
   * - 특정 카드의 데이터를 가져옵니다.
   * ---------------------------------------------
   * @param {string} cardPrefabId 카드 prefabId
   * @returns {Object|null} 해당 카드 데이터 또는 null
   */
  getSkillsDataByPrefabId(skillPrefabId:string) {
    let skill = this.skills.get(skillPrefabId) || null;
    return skill;
  }

  /**
   * ---------------------------------------------
   * [getAllTowers]
   * - 모든 타워 데이터를 가져옵니다.
   * ---------------------------------------------
   * @returns {Array<Object>} 모든 타워 데이터 배열
   */
  getAllTowers() {
    return this.towers;
  }


  /**
   * ---------------------------------------------
   * [getRandomTowerCards]
   * - 랜덤 타워 카드 배열 반환
   * ---------------------------------------------
   * @param {number} num 뽑을 카드의 수
   * @returns {Array<CardData>} 
   */
  getRandomTowerCards(num = 1) {
    const ret = [];
    for (let i = 0; i < num; i += 1) {
      const randomIndex = Math.floor(Math.random() * this.towerPrefabIdCaches.length);
      const card = create(CardDataSchema, {
        cardId: uuidv4(),
        prefabId: this.towerPrefabIdCaches[randomIndex]
      })
      ret.push(card);
    }
    return ret;
  }

  /**
     * ---------------------------------------------
     * [getRandomSkillCards]
     * - 랜덤 스킬 카드 배열 반환
     * ---------------------------------------------
     * @param {number} num 뽑을 카드의 수
     * @returns {Array<CardData>} 
     */
  getRandomSkillCards(num = 1) {
    const ret = [];
    for (let i = 0; i < num; i += 1) {
      const randomIndex = Math.floor(Math.random() * this.skillPrefabIdCaches.length);
      const card = create(CardDataSchema, {
        cardId: uuidv4(),
        prefabId: this.skillPrefabIdCaches[randomIndex]
      })
      ret.push(card);
    }
    return ret;
  }

  /**
     * ---------------------------------------------
     * [getRandomCards]
     * - 랜덤 카드 배열 반환
     * ---------------------------------------------
     * @param {number} num 뽑을 카드의 수
     * @returns {Array<CardData>} 
     */
  getRandomCards(num = 1) {
    //시간 남으면 subarray를 사용해서 최적화 해보기
    const numTowerCards = Math.floor(Math.random() * (num + 1));
    let towerCards = this.getRandomTowerCards(numTowerCards);
    let skillCards = this.getRandomSkillCards(num - numTowerCards);
    //let skillCards = this.getRandomSkillCards(num);

    return towerCards.concat(skillCards);
    //return skillCards;
  }
}

export const assetManager = new AssetManager();
