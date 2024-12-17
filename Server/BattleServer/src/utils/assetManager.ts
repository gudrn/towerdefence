import { ParseUtils } from './parseUtils';
import { v4 as uuidv4 } from 'uuid';
import { CardData, CardDataSchema } from 'src/protocol/struct_pb';
import { create } from '@bufbuild/protobuf';
import { AssetMonster } from './interfaces/assetMonster';
import { AssetTower } from './interfaces/assetTower';
import { AssetSkill } from './interfaces/assetSkill';
import { AssetCharacter } from './interfaces/assetCharacter';

/**
 * ---------------------------------------------
 * ServerAssetManager
 *
 * - 목적: game asset을 중앙에서 관리하기 위함
 * - 장점: 유지 보수 용이
 * ---------------------------------------------
 */
class AssetManager {
  private monsters: Map<string, AssetMonster>;
  private towers: Map<string, AssetTower>;
  private skills: Map<string, AssetSkill>;
  private characters: Map<string, AssetCharacter>;

  private towerPrefabIdCaches: Array<string>;
  private skillPrefabIdCaches: Array<string>;
  private normalMoster: Array<AssetMonster>;

  constructor() {
    this.monsters = new Map<string, AssetMonster>();
    this.towers = new Map<string, AssetTower>();
    this.skills = new Map();
    this.characters = new Map<string, AssetCharacter>();

    this.towerPrefabIdCaches = new Array<string>();
    this.skillPrefabIdCaches = new Array<string>();
    this.normalMoster = new Array<AssetMonster>();
  }

  /*---------------------------------------------
    [게임 에셋 불러오기]
---------------------------------------------*/
  async loadGameAssets() {
    try {
      const [monsters, towers, skills, characters] = await Promise.all([
        ParseUtils.readFileAsync('monsters.json'),
        ParseUtils.readFileAsync('towers.json'),
        ParseUtils.readFileAsync('skills.json'),
        ParseUtils.readFileAsync('characters.json'),
      ]);

      //몬스터 자원 로드
      this.monsters = new Map(
        monsters.data.map((monster: AssetMonster) => [monster.prefabId, monster]), // prefabId를 키로 사용
      );

      this.normalMoster = Array.from(this.monsters.values()).filter(
        (monster) => monster.prefabId !== 'Robot5',
      );

      //타워 자원 로드
      this.towers = new Map(
        towers.data.map((tower: AssetTower) => [tower.prefabId, tower]), // prefabId를 키로 사용
      );
      //타워 자원 로드2
      this.towerPrefabIdCaches = towers.data.map((tower: AssetTower) => tower.prefabId);

      //스킬 자원 로드
      this.skills = new Map(
        skills.data.map((skill: AssetSkill) => [skill.prefabId, skill]), // prefabId를 키로 사용
      );
      //스킬 자원 로드2
      this.skillPrefabIdCaches = skills.data.map((skill: AssetSkill) => skill.prefabId);

      //캐릭터 자원 로드
      this.characters = new Map(
        characters.data.map((character: AssetCharacter) => [character.prefabId, character]), // prefabId를 키로 사용
      );

      if (!this.monsters || this.towers.size === 0) throw new Error('asset is null');

      return {
        monsters: Array.from(this.monsters.values()),
        towers: Array.from(this.towers.values()), // Map 데이터를 배열로 변환
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
      skills: this.skills,
    };
  }

  /*---------------------------------------------
    [getMonsterData]
      - 특정 몬스터의 데이터를 가져옵니다.
---------------------------------------------*/
  getMonsterData(prefabId: string): AssetMonster | null {
    let monster = this.monsters.get(prefabId) || null;
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
    const random = Math.floor(Math.random() * this.normalMoster.length);
    return this.normalMoster[random];
  }

  /**
   * ---------------------------------------------
   * [getTowerData]
   * - 특정 타워의 데이터를 가져옵니다.
   * ---------------------------------------------
   * @param {string} prefabId 타워 prefabId
   * @returns {Object|null} 해당 타워 데이터 또는 null
   */
  getTowerData(prefabId: string) {
    let tower = this.towers.get(prefabId) || null; // Map의 get() 메서드 사용
    console.log('tower정보');
    console.log(tower);
    return tower;
  }

  /**
   * ---------------------------------------------
   * [getCharacterData]
   * - 특정 캐릭터의 데이터를 가져옵니다.
   * ---------------------------------------------
   * @param {string} prefabId 캐릭터 prefabId
   * @returns {Object|null} 해당 캐릭터 데이터 또는 null
   */
  getCharacterData(prefabId: string): AssetCharacter | null {
    let character = this.characters.get(prefabId) || null;
    console.log('character정보');
    console.log(character);
    return character;
  }

  /**
   * ---------------------------------------------
   * [getCardDataByPrefabId]
   * - 특정 카드의 데이터를 가져옵니다.
   * ---------------------------------------------
   * @param {string} cardPrefabId 카드 prefabId
   * @returns {Object|null} 해당 카드 데이터 또는 null
   */
  getSkillsDataByPrefabId(skillPrefabId: string): AssetSkill | null {
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
        prefabId: this.towerPrefabIdCaches[randomIndex],
      });
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
        prefabId: this.skillPrefabIdCaches[randomIndex],
      });
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
