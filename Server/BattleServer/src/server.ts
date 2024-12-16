import net, { Server, Socket } from 'net';
import { SessionManager } from "ServerCore/network/sessionManager";
import { onConnection } from "./main/handler/initPacketHandler";
import { assetManager } from "./utils/assetManager";
import { battleConfig } from "./config/config";
import { BattleSession } from "./main/session/battleSession";

const server: Server = net.createServer(onConnection);
/*---------------------------------------------
    [전역 변수]
      -sessionManager: 
---------------------------------------------*/
export const sessionManager: SessionManager<BattleSession> = new SessionManager(BattleSession);

const initServer = async () => {
  try {
    const asset = await assetManager.loadGameAssets();
    
  } catch (error: any) {
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
