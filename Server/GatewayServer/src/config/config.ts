import dotenv from 'dotenv';

export interface iServerConfig {
  host: string;
  port: number;
}

// 환경 변수 로드
dotenv.config();

// 공통 설정
export const CLIENT_VERSION = '1.0.0';
export const HOST = '0.0.0.0';
export const lobbyHost = 'ec2-13-125-252-89.ap-northeast-2.compute.amazonaws.com';
//export const lobbyHost2 = 'ec2-13-209-40-196.ap-northeast-2.compute.amazonaws.com';
export const battleHost = 'ec2-13-125-252-89.ap-northeast-2.compute.amazonaws.com';
//export const battleHost2 = 'ec2-13-209-40-196.ap-northeast-2.compute.amazonaws.com';

// 로비 서버 설정
export const lobbyConfig: iServerConfig[] = [
  { host: lobbyHost, port: 3000 }, // 로비 서버 1
  //{ host: lobbyHost2, port: 3001 }, // 로비 서버 2
];

// 배틀 서버 설정
export const battleConfig: iServerConfig[] = [
  { host: battleHost, port: 3005 }, // 배틀 서버 1
  //{ host: battleHost2, port: 3006 }, // 배틀 서버 2
];

// 게이트웨이 서버 설정
export const gatewayConfig: iServerConfig = {
  host: HOST,
  port: 9000,
};

export const roomConfig = {
  MAX_ROOMS_SIZE: 10000,
  AVAILABLE_ROOM_IDS_KEY: 'available_room_id_key',
  ROOM_KEY: 'room_key',
};
