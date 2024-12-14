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
exports.findUserById = exports.findUserByPassword = exports.findUserByNickname = exports.findUserByEmail = exports.createUser = void 0;
const database_js_1 = __importDefault(require("../database.js"));
const user_query_js_1 = require("./user.query.js");
// 유저 생성
const createUser = (email, password, nickname) => __awaiter(void 0, void 0, void 0, function* () {
    yield database_js_1.default.USER_DB.query(user_query_js_1.SQL_QUERIES.CREATE_USER, [email, password, nickname]);
});
exports.createUser = createUser;
// 유저 확인
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield database_js_1.default.USER_DB.query(user_query_js_1.SQL_QUERIES.FIND_USER_BY_ID, [email]);
        return rows[0]; // 첫 번째 결과 반환
    }
    catch (e) {
        console.error(e);
        return undefined;
    }
});
exports.findUserByEmail = findUserByEmail;
// 닉네임을 이용해 사용자의 정보를 찾는다
const findUserByNickname = (nickname) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield database_js_1.default.USER_DB.query(user_query_js_1.SQL_QUERIES.FIND_USER_BY_NICKNAME, [nickname]);
        return rows[0];
    }
    catch (e) {
        console.error(e);
        return undefined;
    }
});
exports.findUserByNickname = findUserByNickname;
// 비밀번호를 이용해 사용자의 정보를 찾는다
const findUserByPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield database_js_1.default.USER_DB.query(user_query_js_1.SQL_QUERIES.FIND_USER_BY_PASSWORD, [password]);
        return rows[0];
    }
    catch (e) {
        console.error(e);
        return undefined;
    }
});
exports.findUserByPassword = findUserByPassword;
// user_id를 이용해 사용자의 정보를 찾는다
const findUserById = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield database_js_1.default.USER_DB.query(user_query_js_1.SQL_QUERIES.FIND_USER_BY_USERID, [user_id]);
        return rows[0];
    }
    catch (e) {
        console.error(e);
        return undefined;
    }
});
exports.findUserById = findUserById;
