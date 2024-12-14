import { GameRoom } from '../room/gameRoom';
import { Tower } from '../game/tower';

export class TowerManager {
  private gameRoom: GameRoom;
  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 200; // ms

  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  /**
   * 모든 타워의 상태를 업데이트합니다
   */
  updateTowers() {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.UPDATE_INTERVAL) return;
    
    this.lastUpdateTime = currentTime;
    
    // 몬스터가 없으면 타워 업데이트 불필요
    const monsters = Array.from(this.gameRoom.getMonsters().values());
    if (monsters.length === 0) return;

    // 타워 목록도 한 번에 가져오기
    const towers = Array.from(this.gameRoom.getTowers().values());
    if (towers.length === 0) return;

    // 각 타워 업데이트
    towers.forEach(tower => tower.update());
  }
}