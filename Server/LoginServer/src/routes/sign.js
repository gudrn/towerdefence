'use strict';
import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { signUpSchema, signInSchema } from '../utils/schema/signSchema.js';

const router = express.Router();

/*---------------------------------------------
            [회원 가입]
            register->signup으로 변경
---------------------------------------------*/
router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body;

  // 이미 존재하는 ID와 닉네임인지 확인
  try {
    await signUpSchema.validate(req.body);
    const hashedPwd = await bcrypt.hash(password, 10);
    const isExistedEmail = await prisma.users.findUnique({
      where: { email },
      select: { email: true },
    });

    const isExistedNickname = await prisma.users.findUnique({
      where: { nickname },
      select: { nickname: true },
    });

    if (isExistedEmail) {
      console.log('이미 사용 중인 ID입니다.');
      return res.status(409).json({ message: '이미 사용 중인 ID입니다.' });
    }

    if (isExistedNickname) {
      console.log('이미 사용 중인 닉네임입니다.');
      return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
    }

    await prisma.users.create({
      data: {
        user_id: uuidv4(),
        email,
        password: hashedPwd,
        nickname,
      },
    });

    return res.status(201).json({ email, nickname });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: '유효성 검사 오류', error: err.errors });
    }
    console.error(err);
    return res.status(500).json({ message: '계정을 생성하는 데 실패했습니다.', error: err.message });
  }
});

/*---------------------------------------------
            [로그인]
            login->signin으로 변경
            로그인 성공 시 userId와 nickname을 JWT로 담아서 반환합니다.
---------------------------------------------*/
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    await signInSchema.validate(req.body);
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
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: '유효성 검사 오류', error: err.errors });
    }
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
