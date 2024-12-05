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

export const Config = {
  server: {
    host: HOST,
    port: PORT,
  },
  client: {
    version: CLIENT_VERSION,
  },
  db: {
    host: DB_HOST || '127.0.0.1', // 기본값 추가
    port: DB_PORT || 3306,
    user: DB_USER || 'root',
    password: DB_PASSWORD || 'qwer1234',
    database: DB_NAME || 'user_db',
  },
  redisClient: {
    host: REDIS_URL || 'redis://localhost:5000', // 기본값 추가
  },
};