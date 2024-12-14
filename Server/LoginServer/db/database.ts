import mysql from 'mysql2/promise';

export const config = {
  db: {
    host: 'localhost', // 데이터베이스 호스트
    port: 3306, // 데이터베이스 포트
    user: 'root', // 사용자 이름
    password: 'password', // 비밀번호
    name: 'test_db', // 데이터베이스 이름
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
};

const createPool = (dbConfig) => {
  const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return {
    ...pool,
    async query<T extends mysql.QueryResult>(
      sql: string,
      params?: any
    ): Promise<[T, mysql.FieldPacket[]]> {
      const date = new Date();
      console.log(
        `[쿼리 실행]: ${sql} ${params ? `, ${JSON.stringify(params)}` : ''}`
      );
      return pool.query(sql, params);
    },
  };
};

const pools = {
  USER_DB: createPool(config.db), // config에서 db 설정 가져오기
};

export default pools;