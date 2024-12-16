import { SessionManager } from "ServerCore/network/sessionManager";
import { onConnection } from "./main/handler/initPacketHandler";
import { LobbySession } from "./main/session/lobbySession";
import { lobbyConfig } from "./config/config";
import { createServer } from "net";
import { initLobbyRoom } from "./utils/redis/initRoom";


const server = createServer(onConnection);

/*---------------------------------------------
  [전역 변수]
    - sessionManager: Lobby 서버 세션 관리
---------------------------------------------*/
export const lobbySessionManager = new SessionManager(LobbySession);

const initServer = async () => {
  try {
    await initLobbyRoom();
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
