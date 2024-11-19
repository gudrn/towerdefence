import {
  CLIENT_VERSION,
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  HOST,
  PORT,
  REDIS_URL,
} from '../constants/env.js';

export const config = {
  server: {
    host: HOST,
    port: PORT,
  },
  client: {
    version: CLIENT_VERSION,
  },
  db: {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_NAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
  redisClient: {
    host: REDIS_URL,
  },
};
