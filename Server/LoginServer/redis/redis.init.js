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
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisManager = exports.redisClient = void 0;
exports.redisClient = new Redis(config.redisClient.host);
exports.redisClient.on('error', (err) => console.error('Redis 클라이언트 오류:', err));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!exports.redisClient.status || exports.redisClient.status === 'end') {
            yield exports.redisClient.connect();
            console.log('Redis에 연결되었습니다.');
        }
    }
    catch (error) {
        console.error('Redis에 연결할 수 없습니다:', error);
    }
});
await connectRedis();
exports.redisManager = {
    setCache: (key_1, value_1, ...args_1) => __awaiter(void 0, [key_1, value_1, ...args_1], void 0, function* (key, value, expiration = 3600) {
        try {
            yield exports.redisClient.set(key, JSON.stringify(value), 'EX', expiration);
            console.log(`캐시 설정 완료: ${key}`);
        }
        catch (error) {
            console.error('캐시 설정 중 오류 발생:', error);
        }
    }),
    getCache: (key) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const data = yield exports.redisClient.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('캐시 가져오기 중 오류 발생:', error);
            return null;
        }
    }),
    deleteCache: (key) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield exports.redisClient.del(key);
            console.log(`캐시 삭제 완료: ${key}`);
        }
        catch (error) {
            console.error('캐시 삭제 중 오류 발생:', error);
        }
    }),
    updateCacheExpiration: (key, expiration) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield exports.redisClient.expire(key, expiration);
            console.log(`캐시 만료 시간 업데이트 완료: ${key}`);
        }
        catch (error) {
            console.error('캐시 만료 시간 업데이트 중 오류 발생:', error);
        }
    }),
};
