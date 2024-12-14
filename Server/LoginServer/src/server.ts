import { findUserById, findUserByNickname, findUserByPassword, findUserByEmail } from './../db/user/user.db';
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mysql, { Pool, RowDataPacket } from 'mysql2/promise'; // RowDataPacket 추가
import { config } from '../config/config';
import { redisManager } from '../redis/redis.init';

const app = express();
app.use(express.json());

interface LoginRequestBody {
  email: string;
  password: string;
}

app.post('/login', async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 이메일로 사용자 검색
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
      return;
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
      return;
    }

    // Redis 캐시 확인
    try {
      const doubleLogin = await redisManager.getCache(user.nickname);
      if (doubleLogin) {
        res.status(409).json({ message: '현재 접속 중입니다.' });
        return;
      }

      // Redis 캐시에 사용자 로그인 정보 설정
      await redisManager.setCache(user.nickname, email); // Redis 캐시 설정
    } catch (redisError) {
      console.error('Redis 처리 중 오류 발생:', redisError);
    }

    res.status(201).json({ userid: user.user_id, nickname: user.nickname });
  } catch (e) {
    console.error('로그인 처리 중 서버 오류:', e);
    res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error: e instanceof Error ? e.message : e });
  }
});

export default app;


interface LoginRequestBody {
  email: string;
  nickname?: string; // nickname은 optional로 변경
}

// 비밀번호 찾기 API
app.post('/find/password', async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<void> => {
  try {
    const { email, nickname } = req.body;

    console.log(email, nickname); // 데이터 수신 확인용 로그

    // 이메일로 사용자 찾기
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(404).json({ message: '회원 이메일이 존재하지 않습니다.' });
      return;
    }

    // 닉네임 확인이 필요한 경우
    if (nickname) {
      const userNick = await findUserByNickname(nickname);
      if (!userNick) {
        res.status(404).json({ message: '회원 닉네임이 존재하지 않습니다.' });
        return;
      }
    }

    // 성공 응답 (실제로는 비밀번호 반환 대신 이메일로 전송 등의 로직 필요)
    res.status(200).json({ message: `사용자의 비밀번호는 "${user.password}"입니다.` });
  } catch (e) {
    console.error('서버 오류:', e);
    res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error: e instanceof Error ? e.message : e });
  }
});

// 단일 DB 연결 함수
const createDBConnection = async (): Promise<mysql.Connection> => {
  try {
    const connection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });
    console.log('MySQL 연결 성공');
    return connection;
  } catch (error) {
    console.error('MySQL 연결 실패:', error);
    throw error;
  }
};

// 풀 생성 (이미 초기화된 경우 덮어쓰기 방지)
let db: Pool | null = null;
if (!db) {
  db = mysql.createPool({
    host: config.db.host || 'localhost', // config.db.host를 기본값으로 설정
    user: config.db.user || 'root', // 기본값 추가
    password: config.db.password || 'password', // 기본값 추가
    database: config.db.database || 'your_database', // 기본값 추가
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log('MySQL 풀 생성 완료');
}

// DB 객체 반환 함수
const getDB = (): Pool => {
  if (!db) {
    throw new Error('DB가 초기화되지 않았습니다.');
  }
  return db;
};

export { app, createDBConnection, db, getDB };

app.get('/friendsList/email/:email', async (req: Request<{ email: string }>, res: Response): Promise<void> => {
  try {
    const database = getDB();
    const { email } = req.params;

    if (!email) {
      res.status(400).json({ message: 'Email 필드가 필요합니다.' });
      return;
    }

    const [userRows] = await database.query<RowDataPacket[]>(
      'SELECT user_id FROM usertable WHERE email = ?',
      [email]
    );
    const user = userRows[0];

    if (!user) {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const user_id = user.user_id;

    const [friendsRows] = await database.query<RowDataPacket[]>(
      `SELECT f.friend_id, u.nickname
       FROM friendlist f
       JOIN usertable u ON f.friend_id = u.user_id
       WHERE f.user_id = ?`,
      [user_id]
    );

    res.status(200).json({
      message: '친구 목록 조회에 성공했습니다.',
      friends: friendsRows,
    });
  } catch (error) {
    console.error('오류 발생:', error);
    res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error });
  }
});

const startServer = async () => {
  try {
    const initDB = async () => {
  // 여기에 데이터베이스 초기화 로직 작성
  console.log('initDB 호출됨. 데이터베이스 초기화 로직 추가 필요.');
};

    initDB(); // 데이터베이스 초기화
    console.log('데이터베이스 초기화 완료');

    const port = 3000;
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error);
    process.exit(1);
  }
};


startServer();
 //코드의 작동과정-(위에있는)port와 host에 설정된값을 읽음->app.listen을호출하여 서버실행->서버실행시 콜벡함수가 호출되어 실행정보를 출력

  app.post('/find/email', async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<void> => {
    const { nickname, password } = req.body;

    // 닉네임 값 검증
    if (!nickname) {
      res.status(400).json({ message: '닉네임 필드는 필수입니다.' });
      return;
    }
  
    try {
      // 1. 닉네임으로 사용자 조회
      const user = await findUserByNickname(nickname);
      if (!user) {
        res.status(404).json({ message: '회원 닉네임이 존재하지 않습니다.' });
        return;
      }
  
      // 2. 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
        return;
      }
  
      // 3. 이메일 반환
      res.status(200).json({ message: `사용자의 이메일은 "${user.email}"입니다` });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('find/email API 오류:', errorMessage);
      res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error: errorMessage });
    }
  });   


  app.post('/find/nickname', async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<void> => {

    try {
      const { email, password } = req.body;   //req.body-json파일담을때사용(주로 post로 정보또는 파일업로드할떄사용)
      const user = await findUserByEmail(email);
      if (!user) {
        res.status(404).json({ message: '회원 이메일이 존재하지 않습니다.' });
        return;
      }
      const userPass = await findUserByPassword(password);
      if (!userPass) {
        res.status(404).json({ message: '회원 비밀번호가 존재하지 않습니다.' });
        return;
      }
      if (!email) {
     res.status(404).json({ message: '회원 이메일이 존재하지 않습니다.' }); //이메일 검증
      } else if (!userPass) {
       res.status(404).json({ message: `회원 비밀번호가 존재하지 않습니다.` }); //비밀번호 검증
      } else {
       res.status(200).json({ message: `사용자의 닉네임은 "${user.nickname}"입니다` }); //성공 응답
      }    //res.jsonjson형식의 데이터를 클라이언트에 응답으로 전송
      //+친구정보
    } catch (e) {                                 //오류처리
      console.error(e);
      res.status(500).json({ message: '서버에서 문제가 발생했습니다.' });
    }
  });
  
  

  app.get('/userinfo', async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<void> => {
    try {
      const nickname = typeof req.query.nickname === 'string' ? req.query.nickname : undefined;
  
      if (!nickname) {
        res.status(400).json({ message: '닉네임 필드는 필수입니다.' });
        return;
      }
  
      const user = await findUserByNickname(nickname);
      if (!user) {
        res.status(404).json({ message: '회원의 닉네임이 존재하지 않습니다.' });
      } else {
        res.status(200).json({
          message: "사용자 정보 조회 성공",
          user: {
            email: user.email,
            last_login: user.last_login,
            created_at: user.created_at,
            user_id: user.user_id
          }
        });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: '해당 닉네임의 사용자를 찾을 수 없습니다.' });
    }
  });
  

  app.patch('/userinfos', async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<void> => {
    const { email, nickname, password } = req.body;
  
    try {
      // 이메일 유효성 확인
      if (!email) {
        res.status(400).json({ message: "이메일은 필수입니다." });
        return;
      }
  
      // 이메일로 사용자 찾기
      const user = await findUserByEmail(email);
      if (!user) {
        res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        return;
      }
  
      // 사용자 정보 업데이트
      if (nickname) {
        user.nickname = nickname;
      }
  
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 해시
        user.password = hashedPassword;
      }
  
      // 데이터베이스 업데이트 (예: user DB에 반영하는 로직 필요)
      if (!db) {
        throw new Error('데이터베이스 연결이 초기화되지 않았습니다.');
      }
      await db.query(
          `UPDATE usertable SET nickname = ?, password = ? WHERE user_id = ?`,
          [user.nickname, user.password, user.user_id]
        );
  
      // 성공 응답
      res.status(200).json({
        message: "사용자 정보가 성공적으로 업데이트되었습니다.",
        user
      });
    } catch (error) {
      console.error('Error:', error); // 에러 로그 출력
      res.status(500).json({ message: "서버에서 문제가 발생했습니다." });
    }
  });
  