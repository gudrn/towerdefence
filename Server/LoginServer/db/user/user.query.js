export const SQL_QUERIES = {
  //유저 생성
  CREATE_USER: 'INSERT INTO USER_DB.userTable (email, password, nickname) VALUES(?,?,?)',
  //유저 조회
  FIND_USER_BY_ID: 'SELECT * FROM USER_DB.userTable WHERE email = ?',
  FIND_USER_BY_NICKNAME: 'SELECT * FROM USER_DB.userTable WHERE nickname = ?',
  FIND_USER_BY_PASSWORD: 'SELECT * FROM USER_DB.userTable WHERE password = ?',
  FIND_USER_BY_USER_ID: 'SELECT * FROM USER_DB.userTable WHERE user_id = ?'
};
