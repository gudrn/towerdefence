import { GameRoom } from './gameRoom.js/index.js';
import { Monster } from '../game/monster.js';
import { PosInfoSchema } from '../../protocol/struct_pb.js';
import { create } from '@bufbuild/protobuf';
import { v4 as uuidv4 } from 'uuid';
import { assetManager } from '../../utils/assetManager.js';

/**
 * 몬스터 스포너 클래스
 *
 * - 게임 방에서 몬스터를 일정 간격으로 스폰하는 기능을 담당
 */
export class MonsterSpawner {
  /**
   * @type {GameRoom} gameRoom - 몬스터가 생성될 게임 방
   */
  gameRoom;

  /**
   * @type {number} - 현재까지 생성된 몬스터 수
   */
  spawnedMonster = 0;

  /**
   * @type {number} - 생성할 총 몬스터 수
   */
  stageMonsters = 0;

  /**
   * @type {number} - 몬스터 생성 간격(ms)
   */
  spawnRate = 0;

  /**
   * @type {NodeJS.Timeout | undefined} - 생성 간격 타이머
   */
  spawnTimer = undefined;

  /**
   * @type {Array<{x: number, y: number}>} - 몬스터 스폰 위치 목록
   * @static
   */
  static spawnPositions() {
    return [
      { x: 15, y: Math.round(Math.random() * 32) - 16 },
      { x: Math.round(Math.random() * 32) - 16, y: 15 },
      { x: Math.round(Math.random() * 32) - 16, y: -16 },
      { x: -16, y: Math.round(Math.random() * 32) - 16 },
    ];
  }

  /**
   * MonsterSpawner 생성자
   * @param {GameRoom} gameRoom - 몬스터가 생성될 게임 방
   */
  constructor(gameRoom) {
    this.gameRoom = gameRoom;
  }

  /**
   * 스폰 시작
   *
   * - 지정된 스테이지 ID의 정보를 기반으로 몬스터 생성 시작
   *
   * @param {number} stageId - 스테이지 ID
   */
  startSpawning(stageId) {
    const stageInfo = assetManager.getStage(stageId);
    console.log(stageInfo, 'stageInfo', stageId);
    this.spawnedMonster = 0; // 생성된 몬스터 수 초기화
    this.stageMonsters = stageInfo.stageMonsters; // 생성할 총 몬스터 수
    this.spawnRate = stageInfo.spawnRate; // 몬스터 생성 간격(ms)

    this.spawnTimer = setInterval(() => {
      console.log('monsterLog: ', this.spawnedMonster, this.stageMonsters);
      if (this.spawnedMonster < this.stageMonsters) {
        this.spawnMonster(); // 몬스터 생성
        this.spawnedMonster += 1;
      } else {
        this.stopSpawning();
      }
    }, this.spawnRate);
  }

  /**
   * 몬스터 스폰
   *
   * - 지정된 위치에 몬스터를 생성하고 게임 방에 추가
   */
  spawnMonster() {
    if (this.gameRoom.getMonsterCount() >= this.stageMonsters) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * MonsterSpawner.spawnPositions.length);
    const randomSpawnPos = MonsterSpawner.spawnPositions[randomIndex];

    const newUuid = uuidv4();
    console.log('Generated UUID:', newUuid);

    const posInfo = create(PosInfoSchema, {
      uuid: newUuid,
      x: randomSpawnPos.x,
      y: randomSpawnPos.y,
    });

    console.log(posInfo.uuid);
    const randomAssetMonster = assetManager.getRandomAssetMonster();
    const monster = new Monster(
      posInfo,
      randomAssetMonster.maxHp,
      randomAssetMonster.prefabId,
      randomAssetMonster.attackPower,
      randomAssetMonster.range,
      this.gameRoom, // GameRoom 참조 전달
    );

    // // 초기 환경 정보 전달
    // monster.updateEnvironment(
    //   this.gameRoom.obstacles,
    //   Array.from(this.gameRoom.towerList.values()),
    // );

    console.log(monster);
    this.gameRoom.addObject(monster);
  }

  /**
   * 스폰 중지
   *
   * - 현재 진행 중인 몬스터 생성 간격 타이머를 멈춤
   */
  stopSpawning() {
    this.spawnedMonster = 0;
    clearInterval(this.spawnTimer);
  }
}
