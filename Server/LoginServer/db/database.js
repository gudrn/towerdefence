"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
exports.config = {
    db: {
        host: 'localhost', // 데이터베이스 호스트
        port: 3306, // 데이터베이스 포트
        user: 'root', // 사용자 이름
        password: 'password', // 비밀번호
        name: 'test_db', // 데이터베이스 이름
    },
    server: {
        host: '127.0.0.1',
        port: 3000,
    },
};
const createPool = (dbConfig) => {
    const pool = promise_1.default.createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.name,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
    return Object.assign(Object.assign({}, pool), { query(sql, params) {
            return __awaiter(this, void 0, void 0, function* () {
                const date = new Date();
                console.log(`[쿼리 실행]: ${sql} ${params ? `, ${JSON.stringify(params)}` : ''}`);
                return pool.query(sql, params);
            });
        } });
};
const pools = {
    USER_DB: createPool(exports.config.db), // config에서 db 설정 가져오기
};
exports.default = pools;
