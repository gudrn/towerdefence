import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || '0.0.0.0';
export const CLIENT_VERSION = process.env.CLIENT_VERSION || '1.0.0';

export const DB_HOST = process.env.DB_HOST || '';
export const DB_PORT = process.env.DB_PORT || 3306;
export const DB_USER = process.env.DB_USER || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || 'jkl123123';
export const DB_NAME = process.env.DB_NAME || 'USER_DB';

export const REDIS_URL = process.env.REDIS_URL;
