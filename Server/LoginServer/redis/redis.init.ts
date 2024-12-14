import Redis from 'ioredis';
import { config as appConfig } from '../config/config'; // 로컬 선언과 충돌 방지를 위해 config 이름 변경

// Redis 설정 타입 정의
interface RedisConfig {
  host: string;
  port: number;
}

// Redis 클라이언트 초기화
if (!appConfig.redisClient || !appConfig.redisClient.host) {
  throw new Error('Redis 클라이언트 호스트가 설정되지 않았습니다. appConfig.redisClient.host를 확인하세요.');
}

// Redis 설정 확인 및 기본값 제공
const redisConfig: RedisConfig = {
  host: appConfig.redisClient.host,
  port: appConfig.redisClient.port !== undefined ? Number(appConfig.redisClient.port) : 6379, // 기본 포트를 6379로 설정
};

// Redis 클라이언트 생성
export const redisClient = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
});

redisClient.on('error', (err) => console.error('Redis 클라이언트 오류:', err));

const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.status || redisClient.status === 'end') {
      await redisClient.connect();
      console.log('Redis에 연결되었습니다.');
    }
  } catch (error) {
    console.error('Redis에 연결할 수 없습니다:', error);
  }
};

const initializeRedis = async () => {
  await connectRedis();
};

initializeRedis();

export const redisManager = {
  setCache: async (key: string, value: any, expiration: number = 3600): Promise<void> => {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', expiration);
      console.log(`캐시 설정 완료: ${key}`);
    } catch (error) {
      console.error('캐시 설정 중 오류 발생:', error);
    }
  },
  getCache: async (key: string): Promise<any | null> => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('캐시 가져오기 중 오류 발생:', error);
      return null;
    }
  },
  deleteCache: async (key: string): Promise<void> => {
    try {
      await redisClient.del(key);
      console.log(`캐시 삭제 완료: ${key}`);
    } catch (error) {
      console.error('캐시 삭제 중 오류 발생:', error);
    }
  },
  updateCacheExpiration: async (key: string, expiration: number): Promise<void> => {
    try {
      await redisClient.expire(key, expiration);
      console.log(`캐시 만료 시간 업데이트 완료: ${key}`);
    } catch (error) {
      console.error('캐시 만료 시간 업데이트 중 오류 발생:', error);
    }
  },
};
