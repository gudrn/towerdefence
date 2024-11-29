import net from 'net';
import { LobbySession } from './main/session/lobbySession.js';
import { onConnection } from './main/handler/initPacketHandler.js';

import { BattleSession } from './main/session/battleSession.js';

import { battleConfig } from './config/config.js';
import { SessionManager } from 'ServerCore/src/network/sessionManager.js';
import { assetManager } from './utils/assetManager.js';

const server = net.createServer(onConnection);

/*---------------------------------------------
    [전역 변수]
      -sessionManager: 
---------------------------------------------*/
export const sessionManager = new SessionManager(BattleSession);

export let lobbySession = new LobbySession(new net.Socket());
lobbySession.connectLobbyServer();

const initServer = async () => {
  try {
    const asset = await assetManager.loadGameAssets();
    console.log(asset.monsters);
    // 다음 작업
  } catch (error) {
    console.error(error.message);
    process.exit(1); // 오류 발생 시 프로세스 종료
  }
};

initServer()
  .then(() => {
    server.listen(battleConfig.server.port, battleConfig.server.host, () => {
      console.log(
        `서버가 ${battleConfig.server.host}:${battleConfig.server.port}에서 실행 중입니다.`,
      );
      console.log(server.address());
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1); // 오류 발생 시 프로세스 종료
  });
