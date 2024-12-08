"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
/*---------------------------------------------
    [SessionManager]
    - 목적: 세션 관리 및 핸들러 함수에서 클라에게 응답할 때 사용
---------------------------------------------*/
class SessionManager {
    /*---------------------------------------------
      [생성자]
  ---------------------------------------------*/
    constructor(sessionFactory) {
        this.sessions = new Map();
        this.sessionFactory = sessionFactory;
    }
    /*---------------------------------------------
      [세션 추가]
  ---------------------------------------------*/
    addSession(uuid, socket) {
        let session = new this.sessionFactory(socket);
        session.setId(uuid);
        this.sessions.set(uuid, session);
        return session;
    }
    /*---------------------------------------------
      [세션 제거]
  ---------------------------------------------*/
    removeSession(uuid) {
        const ret = this.sessions.delete(uuid);
        return ret;
    }
    /*---------------------------------------------
        [getter]
    ---------------------------------------------*/
    getSessionOrNull(uuid) {
        return this.sessions.get(uuid) || null;
    }
    getNextSequenceOrNull(uuid) {
        const session = this.getSessionOrNull(uuid);
        if (!session) {
            return null;
        }
        return session.getNextSequence();
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=sessionManager.js.map