import { RowDataPacket } from 'mysql2/promise';
import pools from '../database.js';
import { SQL_QUERIES } from './user.query.js';

// 유저 생성
export const createUser = async (email: string, password: string, nickname: string): Promise<void> => {
  await pools.USER_DB.query(SQL_QUERIES.CREATE_USER, [email, password, nickname]);
};

// 유저 확인
export const findUserByEmail = async (email: string): Promise<RowDataPacket | undefined> => {
  try {
    const [rows]: [RowDataPacket[], any] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_ID, [email]);
    return rows[0]; // 첫 번째 결과 반환
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

// 닉네임을 이용해 사용자의 정보를 찾는다
export const findUserByNickname = async (nickname: string): Promise<RowDataPacket | undefined> => {
  try {
    const [rows]: [RowDataPacket[], any] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_NICKNAME, [nickname]);
    return rows[0];
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

// 비밀번호를 이용해 사용자의 정보를 찾는다
export const findUserByPassword = async (password: string): Promise<RowDataPacket | undefined> => {
  try {
    const [rows]: [RowDataPacket[], any] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_PASSWORD, [password]);
    return rows[0];
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

// user_id를 이용해 사용자의 정보를 찾는다
export const findUserById = async (user_id: number): Promise<RowDataPacket | undefined> => {
  try {
    const [rows]: [RowDataPacket[], any] = await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_USERID, [user_id]);
    return rows[0];
  } catch (e) {
    console.error(e);
    return undefined;
  }
};