import dotenv from 'dotenv';

dotenv.config();

export const PORT = 3001;
export const HOST = '0.0.0.0';

export const BATTLE_PORT = 3005;
export const BATTLE_HOST = 'ec2-13-125-199-218.ap-northeast-2.compute.amazonaws.com';

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
  AVAILABLE_ROOM_IDS_KEY: 'available_room_id_key',
  ROOM_KEY: 'room_key',
};
