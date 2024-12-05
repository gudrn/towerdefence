import { CardDataSchema } from '../protocol/struct_pb.js';
import { ParseUtils } from './parseUtils.js';
import { create } from '@bufbuild/protobuf';
import { v4 as uuidv4 } from 'uuid';

/**
 * ---------------------------------------------
 * ServerAssetManager
 *
 * - 목적: game asset을 중앙에서 관리하기 위함
 * - 장점: 유지 보수 용이
 * ---------------------------------------------
 */
class AssetManager {
  /**
   * @type {Map<Object>} 몬스터 데이터를 저장합니다.
   */
  monsters;


  /**
   * @type {Map<string, Object>} 타워 데이터를 저장합니다.
   */
  towers;

  /**
   * @type {Array<string>} 타워 prefabId를 저장합니다.
   */
  towerPrefabIdCaches;

  /**
   * @type {Array<string>} 스킬카드 prefabId를 저장합니다.
   */
  skillPrefabIdCaches;

  constructor() {
    this.monsters = new Map();
    this.towers = new Map();
    this.cards = new Map();
    this.skills = new Map();

    this.towerPrefabIdCaches = new Array();
    this.skillPrefabIdCaches = new Array();
  }

  /**
   * ---------------------------------------------
   * [게임 에셋 불러오기]
   * ---------------------------------------------
   * @returns {Promise<{monsters: Array<Object>}>} 로드된 게임 에셋
   */
  async loadGameAssets() {
    try {
      const [monsters, towers, skills] = await Promise.all([
        ParseUtils.readFileAsync('monsters.json'),
        ParseUtils.readFileAsync('towers.json'),
        ParseUtils.readFileAsync('skills.json'),
      ]);

      // 몬스터 자원 로드
      this.monsters = new Map(monsters.data.map((monster) => [monster.prefabId, monster]));

      // 타워 자원 로드 (prefabId를 키로 설정)
      this.towers = new Map(
        towers.data.map((tower) => [tower.prefabId, tower]), // prefabId를 키로 사용
      );
      //타워 자원 로드2
      this.towerPrefabIdCaches = towers.data.map((tower) => tower.prefabId);

      //스킬 자원 로드
      this.skills = new Map(
        skills.data.map((skill) => [skill.prefabId, skill]) // prefabId를 키로 사용
      );
      //스킬 자원 로드2
      this.skillPrefabIdCaches = skills.data.map((skill) => skill.prefabId);

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


  /**
   * ---------------------------------------------
   * [getMonsterData]
   * - 특정 몬스터의 데이터를 가져옵니다.
   * ---------------------------------------------
   * @param {string} prefabId 몬스터 prefabId
   * @returns {Object|null} 해당 몬스터 데이터 또는 null
   */
  getMonsterData(prefabId) {
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
  getTowerData(prefabId) {
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
  getSkillsDataByPrefabId(skillPrefabId) {
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
