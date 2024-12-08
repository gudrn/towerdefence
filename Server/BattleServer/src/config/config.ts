import dotenv from "dotenv";

dotenv.config();

export const PORT = 3005
//export const HOST ='ec2-13-125-207-67.ap-northeast-2.compute.amazonaws.com';
export const HOST ="127.0.0.1";
export const CLIENT_VERSION = process.env.CLIENT_VERSION || '1.0.0';

export const LOBBY_PORT = 3000;
//export const LOBBY_HOST = 'ec2-13-125-207-67.ap-northeast-2.compute.amazonaws.com';
export const LOBBY_HOST: string = "127.0.0.1";

export const battleConfig = {
  server: {
    port: PORT,
    host: HOST,
  },
  client: {
    version: CLIENT_VERSION,
  },
  lobbyServer: {
    port: LOBBY_PORT,
    host: LOBBY_HOST,
  },
};
