'use strict';
import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma/prisma.js';
import {v4 as uuidv4} from 'uuid';

const router = express.Router();



/*---------------------------------------------
                [친구 추가]
---------------------------------------------*/
router.post('/addToFriendList', async (req, res) => {
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


/*---------------------------------------------
                [친구..?]
---------------------------------------------*/
router.get('/friendsList/email/:email', async (req, res) => {
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

export default router;