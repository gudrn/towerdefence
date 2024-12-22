import exp from 'constants';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: 6379,
    tls: {}, // TLS(SSL) 연결 활성화
  });