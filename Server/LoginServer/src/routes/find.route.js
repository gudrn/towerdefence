'use strict';
import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma/prisma.js';
import {v4 as uuidv4} from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();
/*---------------------------------------------
            [비밀번호 찾기]
---------------------------------------------*/
router.post('/find/password', async (req, res) => {

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

/*---------------------------------------------
            [아이디 찾기]
---------------------------------------------*/
router.post('/find/email', async (req, res) => {
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

/*---------------------------------------------
            닉네임 찾기
---------------------------------------------*/
router.post('/find/nickname', async (req, res) => {

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