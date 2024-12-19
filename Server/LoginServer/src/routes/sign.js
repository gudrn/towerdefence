'use strict';
import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();

/*---------------------------------------------
            [회원 가입]
            register->signup으로 변경
---------------------------------------------*/
router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body;
  // 1. 필수 입력 값 확인
  if (!email || !password || !nickname) {
    console.log('이메일, 비밀번호, 또는 닉네임이 누락되었습니다.');
    return res.status(400).send('이메일, 비밀번호, 또는 닉네임이 누락되었습니다.');
  }

  // 2. 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('유효하지 않은 이메일 형식입니다.');
  }

  // 3. 비밀번호 복잡성 검증
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).send('비밀번호는 최소 8자 이상의 영문자, 숫자를 포함해야 합니다.');
  }

  // 4. 닉네임 검증
  if (nickname.length < 2 || nickname.length > 10) {
    return res.status(400).send('닉네임은 2자 이상 10자 이하여야 합니다.');
  }

  const nicknameRegex = /^[a-zA-Z가-힣0-9_]+$/;
  if (!nicknameRegex.test(nickname)) {
    return res.status(400).send('닉네임에는 특수문자를 사용할 수 없습니다.');
  }
  //body 유효성 검사

  const hashedPwd = await bcrypt.hash(password, 10);

  //이미 존재하는 ID인지 확인
  try {
    const isExistedEmail = await prisma.users.findUnique({
      where: {
        email,
      },
      select: {
        email: true,
      },
    });

    if (isExistedEmail) {
      return res.status(409).send('이미 사용 중인 ID입니다.');
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send('계정을 생성하는 데 실패했습니다.' + '에러 코드: ' + err);
  }

  try {
    await prisma.users.create({
      data: {
        user_id: uuidv4(),
        email,
        password: hashedPwd,
        nickname,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send('계정을 생성하는 데 실패했습니다.' + '에러 코드: ' + err);
  }

  return res.status(201).json({ email, nickname });
});

/*---------------------------------------------
            [로그인]
            login->signin으로 변경
            로그인 성공 시 userId와 nickname을 JWT로 담아서 반환합니다.
---------------------------------------------*/
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('이메일 또는 비밀번호가 누락되었습니다.');
    return res.status(400).json({ message: '이메일 또는 비밀번호가 누락되었습니다.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: '유효하지 않은 이메일 형식입니다.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: '비밀번호는 최소 8자 이상이어야 합니다.' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: '사용자가 존재하지 않습니다.' });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { userId: user.user_id, nickname: user.nickname },
        process.env.JWT_SECRET,
        {
          expiresIn: '1h',
        },
      );
      return res.status(200).json({ token, userId: user.user_id, nickname: user.nickname });
    }
  } catch (err) {
    console.log(err);
  }
  return res.status(409).json({ message: '비밀번호가 일치하지 않습니다.' });
});
/*---------------------------------------------
            [사용자 정보 조회]
---------------------------------------------*/
router.get('/userinfo', async (req, res) => {
  try {
    const { nickname } = req.query;
    const user = await findUserByNickname(nickname);
    if (!user) {
      return res.status(404).json({ message: '회원의 닉네임이 존재하지 않습니다.' });
    } else {
      return res.status(200).json({
        message: '사용자 정보 조회 성공',
        user: {
          email: user.email,
          last_login: user.last_login,
          created_at: user.created_at,
          user_id: user.user_id,
        },
      });
    }
  } catch (e) {
    console.error(e);
    return res.status(404).json({ message: '해당 닉네임의 사용자를 찾을 수 없습니다.' });
  }
});

export default router;
