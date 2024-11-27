import { ParseUtils } from './parseUtils.js';

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
   * @type {Array<Object>} 몬스터 데이터를 저장합니다.
   */
  monsters;

  /**
   * @type {Array<Object>} 스테이지 데이터를 저장합니다.
   */
  stages;

  /**
   * @type {Array<Object>} 타워 데이터를 저장합니다.
   */
  towers;

  constructor() {
    this.monsters = [];
    this.stages = [];
    this.towers = [];
  }

  /**
   * ---------------------------------------------
   * [게임 에셋 불러오기]
   * ---------------------------------------------
   * @returns {Promise<{monsters: Array<Object>}>} 로드된 게임 에셋
   */
  async loadGameAssets() {
    try {
      const [monsters, stages, towers] = await Promise.all([
        ParseUtils.readFileAsync('monsters.json'),
        ParseUtils.readFileAsync('stages.json'),
        ParseUtils.readFileAsync('tower.json'),
      ]);

      // 몬스터 자원 로드
      this.monsters = monsters.data;
      // 스테이지 자원 로드
      this.stages = stages.data;
      // 타워 자원 로드
      this.towers = towers.data;

      if (this.monsters == undefined || this.towers == undefined) throw new Error('asset is null');

      return {
        monsters: this.monsters,
        towers: this.towers,
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
   * @returns {{monsters: Array<Object>, stages: Array<Object>}} 게임 에셋
   */
  getGameAssets() {
    return {
      monsters: this.monsters,
      stages: this.stages,
      towers: this.towers,
    };
  }

  /**
   * ---------------------------------------------
   * [getStages]
   * ---------------------------------------------
   * @returns {Array<Object>} 모든 스테이지 데이터를 반환합니다.
   */
  getStages() {
    return this.stages;
  }

  /**
   * ---------------------------------------------
   * [getStage]
   * - 특정 스테이지 데이터를 가져옵니다.
   * ---------------------------------------------
   * @param {number} stageId 스테이지 ID
   * @returns {Object|null} 해당 스테이지 데이터 또는 null
   */
  getStage(stageId) {
    return this.stages[stageId] || null;
  }

  /**
   * ---------------------------------------------
   * [getStageMonsters]
   * - 해당 스테이지에서 생성해야 하는 몬스터 수를 가져옵니다.
   * ---------------------------------------------
   * @param {number} stageId 스테이지 ID
   * @returns {Array<Object>|null} 스테이지 몬스터 데이터 또는 null
   */
  getStageMonsters(stageId) {
    return this.stages[stageId]?.stageMonsters || null;
  }

  /**
   * ---------------------------------------------
   * [getRandomAssetMonster]
   * - 랜덤 몬스터 데이터를 가져옵니다.
   * ---------------------------------------------
   * @returns {Object} 랜덤 몬스터 데이터
   */
  getRandomAssetMonster() {
    const monsterId = Math.floor(Math.random() * this.monsters.length);
    return this.monsters[monsterId];
  }

  /**
   * ---------------------------------------------
   * [getTowerData]
   * - 특정 타워의 데이터를 가져옵니다.
   * ---------------------------------------------
   * @param {number} towerId 타워 ID
   * @returns {Object|null} 해당 타워 데이터 또는 null
   */
  getTowerData(towerId) {
    return this.towers.find((tower) => tower.towerId === towerId) || null;
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
}

export const assetManager = new AssetManager();
