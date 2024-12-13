import { GameRoom } from '../room/gameRoom';

export class TowerManager {
  private gameRoom: GameRoom;
  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 200; // ms

  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  updateTowers() {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.UPDATE_INTERVAL) return;
    
    this.lastUpdateTime = currentTime;
    
    // 한 번에 몬스터 목록 가져오기
    const monsters = Array.from(this.gameRoom.getMonsters().values());
    if (monsters.length === 0) return; // 몬스터가 없으면 처리하지 않음

    // 각 타워의 update() 호출
    for (const tower of this.gameRoom.getTowers().values()) {
      tower.update();
    }
  }
}