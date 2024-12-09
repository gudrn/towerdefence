import mysql, { Pool, QueryOptions, RowDataPacket, FieldPacket } from 'mysql2/promise';
import { config } from '../config/config.js';
import { formatDate } from '../util/dataFormatter.js';

const { db } = config;

// 커넥션 풀 생성 함수
const createPool = (dbConfig): Pool => {
  const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    waitForConnections: true,
    connectionLimit: 10, // 커넥션 풀에서 최대 연결 수
    queueLimit: 0, // 0일 경우 무제한 대기열
  });

  // 기존 query 함수 저장
  const originalQuery = pool.query;

  // query 함수 재정의
  pool.query = async (sql: string | QueryOptions, params?: any[]): Promise<[RowDataPacket[], FieldPacket[]]> => {
    const date = new Date();

    console.log(
      `[${formatDate(date)}] 쿼리 실행 중: ${sql} ${params ? `, ${JSON.stringify(params)}` : ''}`,
    );

    // 기존 query 호출
    return originalQuery.call(pool, sql, params || []);
  };

  return pool;
};

// 여러 데이터베이스 풀 설정
const pools = {
  USER_DB: createPool(db),
};

export default pools;
