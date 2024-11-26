import { BattleSession } from '../../main/session/battleSession.js';
export class GamePlayer {
  /**
   * @param {BattleSession} session - 플레이어의 세션 정보
   * @param {GamePlayerData} playerData - 플레이어의 정보 객체
   */
  constructor(session, playerData) {
    this.session = session;
    this.playerData = playerData;
  }
}
