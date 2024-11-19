import express from 'express';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail ,findUserByNickname} from '../db/user/user.db.js';
import { redisManager } from '../redis/redis.init.js';

const saltRounds = 10;
const app = express();

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try{
    const user = await findUserByEmail(email);

    if (!user) {
      res.status(401).json({ message: '존재하지 않은 이메일입니다.' });
    }
    //암호키와 비밀번호 일치하는지 확인 로직 구현
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }
  
    const doubleLogin = await redisManager.getCache(user.nickname);
    if (doubleLogin) {
      res.status(409).json({ message: '현재 접속 중입니다.' });
    }
    redisManager.setCache(nickname,user.email);
  
    return res.status(201).json({userid:user.user_id, nickname:user.nickname}); 
  }
  catch(e){
    console.error(e);
  }
});

app.post('/register', async (req, res) => {
  const { email, password, nickname } = req.body;
  try {
    const user = await findUserByEmail(email);
    const userNick = await findUserByNickname(nickname);
    if (user) {
      return res.status(409).json({message:'해당하는 email이 있습니다.'}); 
    } 
    if(userNick){
      return res.status(409).json({message:'해당하는 닉네임이 있습니다.'});
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await createUser(email,hashedPassword,nickname)
    return res.status(201).json({ message: '회원가입 완료' });
  }
  catch(e){
    console.error(e);
  }
});

app.listen(5000, () => {
  console.log(`LoginServer is running on port 5000`);
});
