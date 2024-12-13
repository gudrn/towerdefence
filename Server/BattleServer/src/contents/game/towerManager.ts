import { assetManager } from 'src/utils/assetManager';
import { GameRoom } from '../room/gameRoom';
import { Tower } from './tower';

export class TowerManager {
  private gameRoom: GameRoom;

  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  /**---------------------------------------------
   * [특수타워 공격 처리]
   ---------------------------------------------*/
  handleTowerActions() {
    for (const tower of this.gameRoom.getTowers().values()) {
      // 타워 데이터 가져오기
      const towerData = assetManager.getCardDataByPrefabId(tower.getPrefabId());

      if (towerData) {
        // 모든 타워는 기본 공격을 수행
        tower.attackTarget(Array.from(this.gameRoom.getMonsters().values()));

        // // 버프 타워는 추가로 버프 처리
        // if (tower.getPrefabId() === 'BuffTower') {
        //   this.handleBuffTower(tower);
        // }
      }
    }
  }

  /**
   * [버프 타워 처리]
   */
  // private handleBuffTower(tower: Tower) {
  //   // 범위 내 타워 버프 처리
  //   const towersInRange = tower.getTowersInRange(Array.from(this.gameRoom.getTowers().values()));
  //   if (towersInRange.length > 0) {
  //     this.applyBuffToTowers(towersInRange, tower.getId());
  //   }
  // }

  /**
   * [타워 버프 적용]
   * 범위 내 타워들은 공격력 5 증가
   * @param towers 버프를 적용할 타워 배열
   * @param buffTowerId 버프를 주는 타워의 ID
   */
  //  private applyBuffToTowers(towers: Tower[], buffTowerId: string) {
  //   towers.forEach((tower) => {
  //     if (tower.getId() === buffTowerId) return; // 자기 자신은 제외
  //     tower.increaseAttackDamage(buffTowerId); // 공격력 5 증가
  //   });
  // }
}
