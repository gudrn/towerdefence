import dotenv from "dotenv";


dotenv.config();

export const PORT = 3000;
//export const HOST = 'ec2-13-125-207-67.ap-northeast-2.compute.amazonaws.com';
export const HOST: string = '127.0.0.1';

export const BATTLE_PORT = 3005;
//export const BATTLE_HOST = 'ec2-13-125-207-67.ap-northeast-2.compute.amazonaws.com';
export const BATTLE_HOST: string = '127.0.0.1';

export const CLIENT_VERSION = process.env.CLIENT_VERSION || '1.0.0';

export const lobbyConfig = {
  server: {
    port: PORT,
    host: HOST,
  },
  client: {
    version: CLIENT_VERSION,
  },
};

export const roomConfig = {
  MAX_ROOMS_SIZE: 10000,
  AVAILABLE_ROOM_IDS_KEY: "available_room_id_key",
  ROOM_KEY: "room_key"
}