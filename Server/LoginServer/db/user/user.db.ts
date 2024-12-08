

//유저 생성
export const createUser = async (email, password, nickname) => {
  await pools.USER_DB.query(SQL_QUERIES.CREATE_USER, [email, password, nickname]);
};

//유저 확인
export const findUserByEmail = async (email) => {
  try {
    const [row] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_ID, [email]);
    return rows[0];
  } catch (e) {
    console.error(e);
  }
};

export const findUserByNickname = async(nickname)=>{
  try{
    const [row] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_NICKNAME,[nickname]);
    return rows[0];
  }
  catch(e){
    console.error(e);
  }
}