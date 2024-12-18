import { v4 as uuidv4 } from 'uuid';
import net, { Server, Socket } from 'net';

import { battleConfig, gatewayConfig, lobbyConfig } from './config/config';
import { LobbySession } from './main/session/lobbySession';
import { SessionManager } from 'ServerCore/network/sessionManager';
import { BattleSession } from './main/session/battleSession';
import { GatewaySession } from './main/session/gatewaySession';
import { onConnection } from './main/handler/initPacketHandler';

export const lobbySessionManager: SessionManager<LobbySession> = new SessionManager(LobbySession);
export const battleSessionManager: SessionManager<BattleSession> = new SessionManager(BattleSession);
export const gatewaySessionManager: SessionManager<GatewaySession> = new SessionManager(GatewaySession);

const server: Server = net.createServer(onConnection);
const serverId: string = uuidv4();

const connectToLobbyServers = () => {
    for(let serverConfig of lobbyConfig) {
        const lobbySession: LobbySession = lobbySessionManager.addSession(uuidv4(), new Socket());
        lobbySession.init(serverConfig.host, serverConfig.port);

        lobbySession.connect(serverConfig.host, serverConfig.port);
    }
};

const connectToBattleServers = () => {
  for(let serverConfig of battleConfig) {
    const id = uuidv4();
    const battleSession: BattleSession = battleSessionManager.addSession(id, new Socket());
    battleSession.init(serverConfig.host, serverConfig.port);
    console.log("BattleSessionId", battleSession.getId());
    battleSession.connect(serverConfig.host, serverConfig.port)
  }
};

const initGatewayServer = async () => { 
  try {
    // 로비 서버 연결
    connectToLobbyServers();

    // 배틀 서버 연결
    connectToBattleServers();
  } catch (error: any) {
    console.error('Gateway initialization failed:', error.message);
    process.exit(1); // 오류 발생 시 프로세스 종료
  }
};


initGatewayServer()
  .then(() => {
    server.listen(gatewayConfig.port, gatewayConfig.host, () => {
      console.log(
        `서버가 ${gatewayConfig.host}:${gatewayConfig.port}에서 실행 중입니다.`,
      );
    });
  })
  .catch((error) => {
    console.error('Error during Gateway Server initialization:', error.message);
    process.exit(1); // 오류 발생 시 프로세스 종료
  });

