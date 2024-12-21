import dotenv from 'dotenv';

dotenv.config();

export const PORT = 3005;
export const HOST = '0.0.0.0';
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
