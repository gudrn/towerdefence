import express from 'express';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, findUserByNickname, findUserByPassword } from '../db/user/user.db.js';
//import { redisManager } from '../redis/redis.init.js';
import mysql from 'mysql2/promise';
import { Config } from '../config/config.js';

const saltRounds = 10;    //-saltRound란?비밀번호 해싱과정에서 추가적인 보안강화를 위해 사용됨(해싱할때 Salt를 추가하여 다른 해시값을 생성하게 함)
const app = express();    //-salt-비밀번호 해싱시 추가되는 랜덤 문자열
app.use(express.json())

app.post('/login', async (req, res) => {
  const { email, password } = req.body; //req.body에서 클라이언트가 보낸 email,password데이터를 추출함

  try {
    // 1. 이메일로 사용자 조회
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
    }

    console.log('평문 비밀번호:', password);     //=>사용자가 입력한 pass와 데이터베이스에 저장된 비밀번호(암호화)user.password룰 bcrypt와 비교함
    console.log('해시된 비밀번호:', user.password);

    // 2. 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);  //isPasswordValid-사용자가 입력한 비밀번호와 데이터베이스에 
    if (!isPasswordValid) {                                                 //저장된 해시된 비밀번호를 비교한 결과를 담는 불리언 변수
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }

    // 3. 이중 로그인 방지 처리
    try {
      const doubleLogin = await redisManager.getCache(user.nickname);  // Redis를 사용하는 애플리케이션에서 캐시 데이터를 가져오는 데 사용되는 함수
      if (doubleLogin) {
        return res.status(409).json({ message: '현재 접속 중입니다.' });
      }

      // Redis에 사용자 세션 추가 (유효 기간 1시간)
      await redisManager.setCache(user.nickname, email);  //  Redis를 사용하여 캐시에 데이터를 저장하는 함수
    } catch (redisError) {                                // 캐싱은 자주 사용되는 데이터나 계산 결과를 빠르게 접근할 수 있는 임시 저장소에 저장하여 성능을 최적화하는 기술
      console.error('Redis 처리 중 오류 발생:', redisError.message);
      // Redis 오류가 있어도 로그인 자체는 허용
    }

    // 4. 로그인 성공 응답
    return res.status(201).json({ userid: user.user_id, nickname: user.nickname });
    // 라이언트로 반환될 데이터 객체입니다. 이 객체는 두 개의 키-값 쌍으로 이루어져 있습니다:
    // userid: 서버에서 관리하는 user 객체의 user_id 속성 값.
    // nickname: 서버에서 관리하는 user 객체의 nickname 속성 값.
  } catch (e) {
    // 서버 내부 오류 처리
    console.error('로그인 처리 중 서버 오류:', e.message);
    return res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error: e.message });
  }
});


//목적-비밀번호 찾기 기능 제공
app.post('/find/password', async (req, res) => {

  try {
    const { email, nickname } = req.body; //json파일담을떄사용
    console.log(email)            //클라이언트에서 보낸 데이터가 올바르게 수신되었는지 확인하기 위해 사용
    const user = await findUserByEmail(email);
    const userNick = await findUserByNickname(nickname);
    if (!user) {
      return res.status(404).json({ message: '회원 이메일이 존재하지 않습니다.' });   
    } else if (!userNick) {
      return res.status(404).json({ message: '회원 닉네임이 존재하지 않습니다.' });
    } else {           //이 두함수는 비동기적으로 사용자정보를 찾음
      return res.status(200).json({ message: `사용자의 비밀번호는 "${user.password}"입니다.` });
    }//4.비밀번호 반환=>
  } catch (e) {        //오류처리위한 js파일의 예외처리구조
    console.error(e);   //5.에러처리
    return res.status(500).json({ message: '서버에서 문제가 발생했습니다.' });
  }
});


app.post('/register', async (req, res) => {    //비동기함수를 선언하는 키워드
  const { email, password, nickname } = req.body; //req.body에서 클라이언트가 보낸 email,password, nickname 데이터를 추출함
  try {

    if (!email || !password || !nickname) {                    //1-2.유효성검사-입력된 데이터가 특정규칙, 형식, 기준을 만족하는지 확인해보는 과정
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    const user = await findUserByEmail(email);                 //1-3.중복검사
    const userNick = await findUserByNickname(nickname);       //await란?비동기 프로그래밍에서 promise의 겨로가를 기다린뒤 실행흐름을 제어하기위해 사용하는 키워드
                                                               //js에서 비동기작업을 관리하고 처리하기위해 사용하는 객체
    if (user) {
      return res.status(409).json({ message: '해당하는 email이 있습니다.' });  //HTTP응답상테코드 설정(예시 200-성공/401-실패)
    }
    if (userNick) {
      return res.status(409).json({ message: '해당하는 닉네임이 있습니다.' });
    }

    // 비밀번호 해싱(비밀번호 암호화)                            //1-4.비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 유저 생성   //-새로운 사용자를 생성하는 함수
    await createUser(email, hashedPassword, nickname);         //1-5.새 사용자 생성
    //성공응답
    return res.status(201).json({ message: '회원가입 완료' });
  } catch (e) {                                                //6.오류처리
    console.error('회원가입 처리 중 에러 발생:', e.message, e.stack);  // e.stack 해당 에러의 콜 스택(call stack) 정보를 문자열 형태로 제공하는 속성
    res.status(500).json({ message: '서버 에러가 발생했습니다.', error: e.message });
  }
});                             //2.데이터베이스 초기화
let db; // 데이터베이스 연결 객체

// MySQL 초기화 함수
const initDB = async () => {   
  try {
    db = await mysql.createPool({         //MySQL 클라이언트의 createPool 메서드를 호출하여 **연결 풀(Connection Pool)**을 생성합니다.
      host: Config.db.host,      // 연결 풀이란 데이터베이스와의 연결을 관리하는 일종의 "연결 그룹"으로, 재사용 가능한 여러 연결을 유지하여 성능을 향상시킵니다.
      user: Config.db.user,
      password: Config.db.password,
      database: Config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('MySQL 연결 성공');
  } catch (error) {
    console.error('MySQL 연결 실패:', error.message);
    throw error;
  }
};

// 사용자 추가 API
export const createDBConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: Config.db.host,
      user: Config.db.user,
      password: Config.db.password,
      database: Config.db.database,
    });

    console.log('MySQL 데이터베이스 연결 성공');
    return connection; // 연결 객체 반환
  } catch (error) {
    console.error('MySQL 데이터베이스 연결 실패:', error.message);
    throw error; // 오류를 호출한 곳으로 전달
  }
};
//목적-친구목록에 사용자추가, 데이터유효성검사, 오류처리, 데이터베이스연결관리
app.post('/addToFriendList', async (req, res) => {
  const connection = await createDBConnection();
  try {
    const { user_id, friend_id } = req.body;  //req.body에서 클라이언트가 보낸 user_id, friend_id데이터를 추출함
    if (!user_id || !friend_id) {
      return res.status(400).json({ message: 'user_id와 friend_id가 필요합니다.' });
    }

    console.log('Adding to friendlist in user_db:', { user_id, friend_id });
                   // 서버가 클라이언트로부터 받은 user_id와 friend_id 데이터를 확인하고 기록하기 위해 쓰임

    const [userCheck] = await connection.query(  //connenction query=데이터베이스 연결객체의 메서드
      'SELECT user_id FROM usertable WHERE user_id = ?',  //?는 플레이스홀더로 실제값은 뒤에 제공됨
      [user_id]          //=>사용자 존재여부확인
    );
    const [friendCheck] = await connection.query(
      'SELECT user_id FROM usertable WHERE user_id = ?',
      [friend_id]         //=>친구ID존재여부 확인
    );

    if (!userCheck.length || !friendCheck.length) {
      return res.status(404).json({ message: 'user_id 또는 friend_id가 유효하지 않습니다.' });
    }                    //=>결과 검증
                                    //=>데이터유효성검증, 데이터무결성보장, 오류야방위해 쓰였음

    const [result] = await connection.query(      //=>insertinfo-friendlist 테이블에 새로운 데이터를 추가/value(?,?)-[user_id, friend_id] 배열이 이 플레이스홀더에 바인딩
      `INSERT INTO friendlist (user_id, friend_id)  
       VALUES (?, ?)`,
      [user_id, friend_id]
    );

    console.log('Friendlist Insert Result:', result);

    res.status(201).json({             //성공응답        //res.status-요청의 성공여부를 클라이언트에 알림
      message: '친구 목록에 성공적으로 추가되었습니다.',
      data: result,
    });
  } catch (error) {                    //오류처리
    console.error('SQL Error:', error.sqlMessage);
    res.status(500).json({
      message: '서버에서 문제가 발생했습니다.',
      error: error.message,
    });
  } finally {             //해당 데이터베이스 작업이 독립적으로 처리되고 있기 때문, 긴 코드의 전체 흐름에서,
    connection.end();     // 각 API 엔드포인트는 독립적인 데이터베이스 연결과 작업을 처리하도록 설계되어 있기 때문
  }  //긴 코드의 맨 끝에 위치한다면, 전체 애플리케이션에서 모든 데이터베이스 작업이 끝난 후에 한 번만 호출되게 됩니다.
     //  하지만, 각각의 요청에 대해 독립적으로 연결을 생성하고 종료해야 하기 때문에 각각의 요청 핸들러 내에서 종료 작업을 수행해야 합니다.
});   //finally { connection.end(); }-자원을 정리하는 역할을함
       //CONSOLE.LOG-결과를 로깅함(콘솔에 정보를 출력하는 함수)
app.get('/friendsList/email/:email', async (req, res) => {            app.get-조회
  try {
    if (!db) {                                        //db가 초기화되지 않으면 에러발생
      throw new Error('Database is not initialized');
    }

    const { email } = req.params;                     //req.params에서 URL로 전달된 email 값을 추출

    if (!email) {                                   
      return res.status(400).json({ message: 'Email 필드가 필요합니다.' });
    }

    console.log('Received email:', email);

    // Email로 user_id 검색
    const [user] = await db.query('SELECT user_id FROM usertable WHERE email = ?', [email]);
    if (!user || user.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    } 

    const user_id = user[0].user_id;
    console.log('User ID retrieved from email:', user_id);

    // 친구 목록 조회   //SELECT-컬럼지정, FROM-friendlist테이블기준데이터가져옴, JOIN-두테이블결합하여 데이터조회, WHERE-조건지정후 데이터 필터링
    const [friendsList] = await db.query(`    
      SELECT f.friend_id, u.nickname
      FROM friendlist f
      JOIN usertable u ON f.friend_id = u.user_id
      WHERE f.user_id = ?;
    `, [user_id]);

    res.status(200).json({  //http 상태코드지정
      message: '친구 목록 조회에 성공했습니다.',
      friends: friendsList,
    });
  } catch (error) {
    console.error('오류 발생:', error.message);
    res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error: error.message });
  }
});

// 서버 시작
const startServer = async () => {          //start server-서버 초기화하고 실행하기 위해 비동기 작업들을 수행함
  try {
    await initDB(); // 데이터베이스 초기화
    console.log('데이터베이스 초기화 완료');

    app.listen(Config.server.port, Config.server.host, () => {    //config.server.port-서버가 실행될포트를 지정함//**host-서버가실행할 호스트주소지정
      console.log(`Server is running on http://${Config.server.host}:${Config.server.port}`);
    });                  //콜백함수-app.listen의 세번째 매개변수로 콜벡함수가 사용됨/콜벡함수내부에서 console.log를 사용해 서버실행정보를 출력함
  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error.message);
    process.exit(1); // 초기화 실패 시 프로세스 종료
  }
};     //코드의 작동과정-(위에있는)port와 host에 설정된값을 읽음->app.listen을호출하여 서버실행->서버실행시 콜벡함수가 호출되어 실행정보를 출력

app.post('/find/email', async (req, res) => {
  const { nickname, password } = req.body;

  try {
    // 1. 닉네임으로 사용자 조회
    const user = await findUserByNickname(nickname);
    if (!user) {
      return res.status(404).json({ message: '회원 닉네임이 존재하지 않습니다.' });
    }

    // 2. 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }

    // 3. 이메일 반환
    return res.status(200).json({ message: `사용자의 이메일은 "${user.email}"입니다` });

  } catch (e) {
    // 4. 서버 오류 처리
    console.error('find/email API 오류:', e.message);
    return res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error: e.message });
  }
});

app.post('/find/nickname', async (req, res) => {

  try {
    const { email, password } = req.body;   //req.body-json파일담을때사용(주로 post로 정보또는 파일업로드할떄사용)
    const user = await findUserByEmail(email);
    const userPass = await findUserByPassword(password);
    if (!email) {
      return res.status(404).json({ message: '회원 이메일이 존재하지 않습니다.' }); //이메일 검증
    } else if (!userPass) {
      return res.status(404).json({ message: `회원 비밀번호가 존재하지 않습니다.` }); //비밀번호 검증
    } else {
      return res.status(200).json({ message: `사용자의 닉네임은 "${user.nickname}"입니다` }); //성공 응답
    }    //res.jsonjson형식의 데이터를 클라이언트에 응답으로 전송
    //+친구정보
  } catch (e) {                                 //오류처리
    console.error(e);
    return res.status(500).json({ message: '서버에서 문제가 발생했습니다.' });
  }
});

app.get('/userinfo', async (req, res) => {
  try {
    const { nickname } = req.query;
    const user = await findUserByNickname(nickname);
    if (!user) {
      return res.status(404).json({ message: '회원의 닉네임이 존재하지 않습니다.' });
    } else {
      return res.status(200).json({
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
    return res.status(404).json({ message: '해당 닉네임의 사용자를 찾을 수 없습니다.' });
  }
}
);

app.patch('/userinfos', async (req, res) => {
  const { email, nickname, password } = req.body;
  const user = await findUserByEmail(email)

  if (!email) {
    return res.status(400).json({ message: "이메일은 필수입니다." });
  }

  try {
    // 3.이메일로 사용자 찾기
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 4.사용자 정보 업데이트
    if (nickname) {
      user.nickname = nickname;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 해시
      user.password = hashedPassword;
    }   //=>사용자 정보의 업데이트할때 수정됨

    return res.status(200).json({         //5.성공응답
      message: "사용자 정보가 성공적으로 업데이트되었습니다.",
      user
    });

  } catch (error) {      //6.오류처리
    console.error('Error:', error); // 에러 로그 출력
    return res.status(500).json({ message: "서버에서 문제가 발생했습니다." });
  }
});
