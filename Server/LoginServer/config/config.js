"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const env_1 = require("../constants/env");
exports.config = {
    server: {
        host: env_1.HOST,
        port: env_1.PORT,
    },
    client: {
        version: env_1.CLIENT_VERSION,
    },
    db: {
        host: env_1.DB_HOST,
        port: env_1.DB_PORT,
        user: env_1.DB_NAME,
        password: env_1.DB_PASSWORD,
        database: env_1.DB_NAME,
    },
    redisClient: {
        host: env_1.REDIS_URL,
    },
};
