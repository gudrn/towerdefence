import { config } from "../../../ServerCore/src/config/config.js";
import { CustomError } from "../../../ServerCore/src/utils/error/customError.js";

export class UserDb {
    static async findUserByDeviceID(deviceId) {
        // 데이터베이스에서 deviceId로 사용자를 찾는 로직 구현
        // 예시: SQL 쿼리 또는 ORM 사용
        try {
            const user = await database.query('SELECT * FROM users WHERE device_id = ?', [deviceId]);
            return user[0];
        } catch (error) {
            throw new CustomError(ErrorCodes.USER_NOT_FOUND, '사용자를 찾을 수 없습니다.');
        }
    }

    static async createUser(deviceId) {
        // 데이터베이스에 새로운 사용자 생성 로직 구현
        // 예시: SQL 쿼리 또는 ORM 사용
        try {
            const result = await database.query('INSERT INTO users (device_id) VALUES (?)', [deviceId]);
            const newUser = await this.findUserByDeviceID(deviceId);
            return newUser;
        } catch (error) {
            throw new CustomError(ErrorCodes.MISSING_FIELDS, '사용자 생성 중 오류가 발생했습니다.');
        }
    }

    static async updateUserLogin(userId) {
        // 사용자의 로그인 시간을 업데이트하는 로직 구현
        // 예시: SQL 쿼리 또는 ORM 사용
        try {
            await database.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
        } catch (error) {
            throw new CustomError(ErrorCodes.INVALID_PACKET, '사용자 로그인 업데이트 중 오류가 발생했습니다.');
        }
    }
}
