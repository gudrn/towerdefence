import dotenv from 'dotenv';

dotenv.config();

export const PORT = 3005;
export const HOST = 'ec2-13-125-199-218.ap-northeast-2.compute.amazonaws.com';
export const CLIENT_VERSION = process.env.CLIENT_VERSION || '1.0.0';

export const battleConfig = {
  server: {
    port: PORT,
    host: HOST,
  },
  client: {
    version: CLIENT_VERSION,
  },
};
