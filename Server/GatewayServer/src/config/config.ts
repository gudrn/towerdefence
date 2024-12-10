import dotenv from 'dotenv';

export interface iServerConfig {
  host: string,
  port: number
};

// 환경 변수 로드
dotenv.config();

// 공통 설정
export const CLIENT_VERSION = '1.0.0';
export const HOST = '127.0.0.1';

// 로비 서버 설정
export const lobbyConfig: iServerConfig[] = [
  { host: HOST, port: 3000 }, // 로비 서버 1
  //{ host: HOST, port: 3001 }, // 로비 서버 2
];

// 배틀 서버 설정
export const battleConfig: iServerConfig[] = [
  { host: HOST, port: 3005 }, // 배틀 서버 1
  //{ host: HOST, port: 3006 }, // 배틀 서버 2
];

// 게이트웨이 서버 설정
export const gatewayConfig: iServerConfig = {
    host: HOST,
    port: 9000,
};

export const roomConfig = {
  MAX_ROOMS_SIZE: 10000,
  AVAILABLE_ROOM_IDS_KEY: "available_room_id_key",
  ROOM_KEY: "room_key"
}