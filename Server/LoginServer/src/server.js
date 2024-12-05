import express from 'express';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail ,findUserByNickname, findUserByPassword } from '../db/user/user.db.js';
import { redisManager } from '../redis/redis.init.js';
import mysql from 'mysql2/promise';
import { Config } from '../config/config.js';

const saltRounds = 10;
const app = express();
app.use(express.json())
                                        
app.post('/login', async (req, res) => { 
  const { email, password } = req.body;  
  try {                                     
    const user = await findUserByEmail(email);  
    if (!user) {                        
      return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
    }                                         

    console.log('평문 비밀번호:', user);
    console.log('해시된 비밀번호:', user.password);  
                                         
    const result = await bcrypt.compare(password, user.password); 
    if (!result) {                                
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' }); 
    }

    const doubleLogin = await redisManager.getCache(user.nickname);    
    if (doubleLogin) {                   //4.이중 로그인 방지
      return res.status(409).json({ message: '현재 접속 중입니다.' });
    }

    await redisManager.setCache(user.nickname, user.email);

    return res.status(201).json({ userid: user.user_id, nickname: user.nickname });  //5.성공응답 반환
  } catch (e) {                           //6.에러처리
    console.error(e);
    return res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error: e.message });
  }
});


//목적-비밀번호 찾기 기능 제공
app.post('/find/password', async (req, res) => {                             
  
  try {                                 
    const { email, nickname } = req.body;      
    console.log(email)                                   
    const user = await findUserByEmail(email); 
    const userNick = await findUserByNickname(nickname);                
    if (!user) {                              
      return res.status(404).json({ message: '회원 이메일이 존재하지 않습니다.' }); 
    } else if (!userNick) {                                                             
      return res.status(404).json({ message: '회원 닉네임이 존재하지 않습니다.' });
    } else {           //이 두함수는 비동기적으로 사용자정보를 찾음
      return res.status(200).json({ message: `사용자의 비밀번호는 "${user.password}"입니다.` }); 
    }//4.비밀번호 반환=>
  } catch (e) {
    console.error(e);   //5.에러처리
    return res.status(500).json({ message: '서버에서 문제가 발생했습니다.' });
  }
});


app.post('/register', async (req, res) => {                   
  const { email, password, nickname } = req.body;               
  try {
   
    if (!email || !password || !nickname) {                    //1-2.유효성검사
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }                                                                 
                                                                     
    const user = await findUserByEmail(email);                 //1-3.중복검사
    const userNick = await findUserByNickname(nickname);

    if (user) {
      return res.status(409).json({ message: '해당하는 email이 있습니다.' });
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
    console.error('회원가입 처리 중 에러 발생:', e.message, e.stack);
    res.status(500).json({ message: '서버 에러가 발생했습니다.', error: e.message });
  }
});                             //2.데이터베이스 초기화
const initDB = async () => {
  try {
    const connection = await mysql.createConnection(Config.db);
    console.log('MySQL 연결 성공');
    await connection.end();
  } catch (error) {
    console.error('MySQL 연결 실패:', error.message);
  }
};


// 사용자 추가 API

//목적-친구목록에 사용자추가, 데이터유효성검사, 오류처리, 데이터베이스연결관리
app.post('/addToFriendList', async (req, res) => {        
  const connection = await createDBConnection();           
  try { 
    const { user_id, friend_id } = req.body;                                    
    if (!user_id || !friend_id) {                         
      return res.status(400).json({ message: 'user_id와 friend_id가 필요합니다.' });
    }    

    console.log('Adding to friendlist in user_db:', { user_id, friend_id });   
    console.log('Adding to friendlist in user_db:', { user_id, friend_id });   
                                                                               

    const [userCheck] = await connection.query(           
      'SELECT user_id FROM usertable WHERE user_id = ?',    
      [user_id]         
    );                               
    const [friendCheck] = await connection.query(
      'SELECT user_id FROM usertable WHERE user_id = ?',
      [friend_id]    
    );

    if (!userCheck.length || !friendCheck.length) {  
      return res.status(404).json({ message: 'user_id 또는 friend_id가 유효하지 않습니다.' });
    }                                                       

                                                           
    const [result] = await connection.query(  
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
  } finally {                                          
    connection.end();                                 
  }
});

app.get('/friendsList/email/:email', async (req, res) => {  
  try {
    const { email } = req.params;                          

    if (!email) {
      return res.status(400).json({ message: 'Email 필드가 필요합니다.' });
    }

    console.log("Received email:", email);

                                                            // Email을 사용해 user_id를 검색(사용자 ID 조회)
    const [user] = await db.query('SELECT user_id FROM usertable WHERE email = ?', [email]);
                                                           //async/await-데이터베이스 쿼리등 비동기작업의 결과를 기다림
    if (!user.length) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user_id = user[0].user_id;
    console.log("User ID retrieved from email:", user_id);

    // 친구 목록 조회
    const [friendsList] = await db.query(                //친구목록조회
      `
      SELECT f.friend_id, u.nickname
      FROM friendlist f
      JOIN usertable u ON f.friend_id = u.user_id
      WHERE f.user_id = ?;
      `,
      [user_id]
    );
      //SELECT-데이터조회/JOIN-두개이상의 테이블을 연결해 데이터를 조회, WHERE-특정조건을 기준으로 데이터를 필터링
    res.status(200).json({                             //성공응답
      message: '친구 목록 조회에 성공했습니다.',
      friends: friendsList,
    });
  } catch (error) {                                    //오류처리
    console.error('오류 발생:', error);
    res.status(500).json({ message: '서버에서 문제가 발생했습니다.', error: error.message });
  }
});


app.post('/find/email', async (req, res) => {                        
                  
  try {
    const { nickname, password } = req.body;              
    const userPass = await findUserByPassword(password);       
    const user = await findUserByNickname(nickname);
    if(!user) {                                    //3.사용자 존재 여부 확인
      return res.status(404).json({ message: '회원 닉네임이 존재하지 않습니다.'}); //res.status-요청처리결과의 상태를 알림
    } else if (!userPass) {
      return res.status(404).json({ message: `회원 비밀번호가 존재하지 않습니다.`});
    } else {
      return res.status(200).json({ message: `사용자의 이메일은 "${user.email}"입니다`}); //4.성공응답
    }              //구조화된 데이터를 클라이언트로 전달
  } catch (e) {                                   //5.오류처리
    console.error(e);
    return res.status(500).json({ message: '서버에서 문제가 발생했습니다.' });
  }
});

app.post('/find/nickname', async (req, res) => {

  try {                             
  const { email, password } = req.body;                         
  const user = await findUserByEmail(email);                 
  const userPass = await findUserByPassword(password);  
    if(!email) {                                 
      return res.status(404).json({ message: '회원 이메일이 존재하지 않습니다.'}); //이메일 검증
    } else if (!userPass) {
      return res.status(404).json({ message: `회원 비밀번호가 존재하지 않습니다.`}); //비밀번호 검증
    } else {
      return res.status(200).json({ message: `사용자의 닉네임은 "${user.nickname}"입니다`}); //성공 응답
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
    if(!user) {                                  
      return res.status(404).json({ message: '회원의 닉네임이 존재하지 않습니다.'});   
    } else {                                                                       
      return res.status(200).json({                                              
        message: "사용자 정보 조회 성공",                                             
         user: {                                                                    
          email: user.email,
          last_login: user.last_login,                                             
          created_at: user.created_at, 
          user_id: user.user_id
        }});
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


//구현방법
//a.메세지전송API
//b.메세지조회API
//C.저장소

// 서버 실행
initDB(); // 데이터베이스 연결 초기화
app.listen(Config.server.port, Config.server.host, () => {
  console.log(`Server is running on http://${Config.server.host}:${Config.server.port}`);
  initDB();
});