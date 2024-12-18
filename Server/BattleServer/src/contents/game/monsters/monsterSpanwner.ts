import { assetManager } from 'src/utils/assetManager';
import { create } from '@bufbuild/protobuf';
import { PosInfoSchema } from 'src/protocol/struct_pb';
import { v4 as uuidv4 } from 'uuid';
import { GameRoom } from '../../room/gameRoom';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { Monster } from './monster';
import { MathUtils } from 'src/utils/mathUtils';
import { MonsterManager } from './monsterManager';
import { AssetMonster } from 'src/utils/interfaces/assetMonster';

/*---------------------------------------------
    [MonsterSpawner]
    - 오직 MonsterManager에서만 접근해야 합니다.
    - spawnRate마다 한 몬스터를 생성합니다.

    [TODO]
    - 몬스터 생성 패킷에 한 몬스터만을 담아서 보내는 중입니다. 
      queue에 담아서 일정주기마다 보내주는 방법으로 변경해야 합니다.
---------------------------------------------*/
export class MonsterSpawner {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  private monsterManager: MonsterManager;
  private spawnRate: number = 4000; //몬스터 생성 간격
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
  constructor(monsterManager: MonsterManager) {
    this.monsterManager = monsterManager;
  }

  /*---------------------------------------------
    [스폰 시작]
  ---------------------------------------------*/
  startSpawning() {
    // 기존 interval이 있다면 먼저 제거
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
    }

    // 새 interval 설정
    this.spawnTimer = setInterval(() => {
      this.spawnMonster(); // 몬스터 생성
    }, this.spawnRate);
  }

  public increaseWave() {
    this.spawnRate = MathUtils.clamp(this.spawnRate - 500, 300, this.spawnRate); // spawnRate 갱신
    this.startSpawning(); // 새로운 rate로 interval 재설정
  }

  /*---------------------------------------------
   * 노말 몬스터 스폰
   * - 지정된 위치에 몬스터를 생성하고 게임 방에 추가
  ---------------------------------------------*/
  public spawnMonster(isEilteMonster: boolean = false) {
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

    let randomAssetMonster: AssetMonster;

    if (isEilteMonster) {
      randomAssetMonster = assetManager.getRandomEliteMonsterAssetMonster();
    } else {
      // 1~4번 몬스터 중 랜덤
      randomAssetMonster = assetManager.getRandomNormalAssetMonster();
    }
    const monster = new Monster(
      randomAssetMonster.prefabId,
      posInfo,
      this.monsterManager.getGameRoom(),
    );
    this.monsterManager.addMonster(monster);
  }

  /*---------------------------------------------
   * 엘리트 몬스터 스폰
   * - 지정된 위치에 몬스터를 생성하고 게임 방에 추가
   * - 점수를 기준으로 
  ---------------------------------------------*/
  spawnEilteMonster() {
    // 랜덤 위치 선택
  }

  /**
   * 스폰 중지
   *
   * - 현재 진행 중인 몬스터 생성 간격 타이머를 멈춤
   */
  public stopSpawning() {
    clearInterval(this.spawnTimer);
  }

  destroy() {
    clearInterval(this.spawnTimer);
  }
}
