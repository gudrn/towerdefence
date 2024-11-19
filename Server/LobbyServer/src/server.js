import net from 'net';

import { onConnection } from './main/handler/initPacketHandler.js';
import { SessionManager } from 'ServerCore/src/network/sessionManager.js';
import { lobbyConfig } from './config/config.js';
import { LobbySession } from './main/session/lobbySession.js';
import { BattleSession } from './main/session/battleSession.js';

const server = net.createServer(onConnection);

/*---------------------------------------------
  [전역 변수]
    - sessionManager: Lobby 서버 세션 관리
    - battleSessionManager: Battle 서버 세션 관리
---------------------------------------------*/
export const lobbySessionManager = new SessionManager(LobbySession);
export const battleSessionManager = new SessionManager(BattleSession);

const initServer = async () => {
  try {
    // 테스트 코드를 여기에 추가해주세요
    //await testAllConnections(pools);
  } catch (error) {
    console.error(error.message);
    process.exit(1); // 오류 발생 시 프로세스 종료
  }
};

initServer()
  .then(() => {
    server.listen(lobbyConfig.server.port, lobbyConfig.server.host, () => {
      console.log(
        `서버가 ${lobbyConfig.server.host}:${lobbyConfig.server.port}에서 실행 중입니다.`,
      );
      console.log('서버 주소:', server.address());
    });
  })
  .catch((error) => {
    console.error('서버 실행 중 오류 발생:', error);
    process.exit(1);
  });
