import { Socket } from "net";

/*---------------------------------------------
    [SessionManager]
    - 목적: 세션 관리 및 핸들러 함수에서 클라에게 응답할 때 사용
---------------------------------------------*/
class SessionManager {
  /*---------------------------------------------
    [멤버 변수]
      - sessions: 
        클라는 반드시 자신의 uuid를 담아서 패킷을 전송하므로
        빠르게 session을 가져오기 위해 Map 선택
  ---------------------------------------------*/
  sessions = new Map();

  /**
   * @param {Function} sessionFactory - 새로운 세션을 생성하는 팩토리 함수
   */
  constructor(sessionFactory) {
    this.sessionFactory = sessionFactory;
  }

  /*---------------------------------------------
    [세션 추가]
  ---------------------------------------------*/
  addSession(uuid, socket) {
    const session = new this.sessionFactory(socket);
    session.setId(uuid);
    this.sessions.set(uuid, session);

    return session;
  }

  /*---------------------------------------------
    [세션 제거]
  ---------------------------------------------*/
  removeSession(uuid) {
    return this.sessions.delete(uuid);
  }

  /*---------------------------------------------
      [getter]
  ---------------------------------------------*/
  getSessionOrNull(id) {
    return this.sessions.get(id) || null;
  }

  //배틀 서버 세션 가져오기(임시)
  getRandomSession() {
    const entries = Array.from(sessions.entries());
    return entries[Math.floor(Math.random() * entries.length)];
  }
  getNextSequenceOrNull(uuid) {
    const session = this.getSessionOrNull(uuid);
    if (!session) {
      return null;
    }

    return session.getNextSequence();
  }
}

export { SessionManager };
