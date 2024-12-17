import { assetManager } from 'src/utils/assetManager';
import { create } from '@bufbuild/protobuf';
import { PosInfoSchema } from 'src/protocol/struct_pb';
import { v4 as uuidv4 } from 'uuid';
import { GameRoom } from './gameRoom';
import { SkillUseMonster } from '../game/skillUseMonster';

/**
 * 몬스터 스포너 클래스
 *
 * - 게임 방에서 몬스터를 일정 간격으로 스폰하는 기능을 담당
 */
export class MonsterSpawner {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  protected gameRoom: GameRoom;
  private spawnedMonster: number = 0;
  protected spawnRate: number = 4000; //몬스터 생성 간격
  private spawnTimer: NodeJS.Timeout | undefined; //NodeJS.Timeout

  public getRandomSpawnPosition() {
    const positions = [
      { x: 0, y: Math.round(Math.random() * 32) }, // Left
      { x: 32, y: Math.round(Math.random() * 32) }, // Right
      { x: Math.round(Math.random() * 32), y: 0 }, // Bottom
      { x: Math.round(Math.random() * 32), y: 32 }, // Top
    ];
    // 배열에서 랜덤하게 하나 선택
    return positions[Math.floor(Math.random() * positions.length)];
  }

  /*---------------------------------------------
    [생성자]
---------------------------------------------*/
  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  /**
   * 스폰 시작
   *
   * - 지정된 스테이지 ID의 정보를 기반으로 몬스터 생성 시작
   */
  startSpawning() {
    this.spawnedMonster = 0; // 생성된 몬스터 수 초기화

    // 기존 interval이 있다면 먼저 제거
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
    }

    // 새 interval 설정
    this.spawnTimer = setInterval(() => {
      this.spawnNomalMonster(); // 몬스터 생성
      this.spawnedMonster += 1;
    }, this.spawnRate);
  }

  protected updateSpawnRate(newRate: number) {
    this.spawnRate = newRate; // spawnRate 갱신
    this.startSpawning(); // 새로운 rate로 interval 재설정
  }

  startSpawningElite() {
    this.spawnEilteMonster(); // 엘리트 몬스터 생성
    this.spawnedMonster += 1;
  }

  /*---------------------------------------------
   * 노말 몬스터 스폰
   * - 지정된 위치에 몬스터를 생성하고 게임 방에 추가
  ---------------------------------------------*/
  spawnNomalMonster() {
    // 랜덤 위치 선택
    const randomSpawnPos = this.getRandomSpawnPosition();

    // 몬스터 uuid 생성
    const newUuid = uuidv4();

    // 위치 정보 생성
    const posInfo = create(PosInfoSchema, {
      uuid: newUuid,
      x: randomSpawnPos.x,
      y: randomSpawnPos.y,
    });

    // 1~4번 몬스터 중 랜덤
    let randomAssetMonster = assetManager.getRandomAssetMonster();
    const monster = new SkillUseMonster(randomAssetMonster.prefabId, posInfo, this.gameRoom);
    monster.statusMultiplier(this.gameRoom.monsterStatusMultiplier); // 강화 배율 적용
    this.gameRoom.addObject(monster);
  }

  /*---------------------------------------------
   * 엘리트 몬스터 스폰
   * - 지정된 위치에 몬스터를 생성하고 게임 방에 추가
   * - 점수를 기준으로 
  ---------------------------------------------*/
  spawnEilteMonster() {
    // 랜덤 위치 선택
    const randomSpawnPos = this.getRandomSpawnPosition();

    // 몬스터 uuid 생성
    const newUuid = uuidv4();

    // 위치 정보 생성
    const posInfo = create(PosInfoSchema, {
      uuid: newUuid,
      x: randomSpawnPos.x,
      y: randomSpawnPos.y,
    });

    // 엘리트 몬스터 가져오기
    let eliteAssetMonster = assetManager.getMonsterData('Robot5');

    // null인지 확인하기
    if (!eliteAssetMonster) {
      console.log('엘리트 몬스터 못 찾음');
      return;
    }

    const monster = new SkillUseMonster(eliteAssetMonster.prefabId, posInfo, this.gameRoom);
    monster.statusMultiplier(this.gameRoom.monsterStatusMultiplier); // 강화 배율 적용
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

  destroy() {
    clearInterval(this.spawnTimer);
  }
}
