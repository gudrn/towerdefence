import { Socket } from "net";
import { Session } from "./session";


type SessionFactory<T extends Session> = new (socket: Socket) => T;
/*---------------------------------------------
    [SessionManager]
    - 목적: 세션 관리 및 핸들러 함수에서 클라에게 응답할 때 사용
---------------------------------------------*/
export class SessionManager<T extends Session> {
  /*---------------------------------------------
    [멤버 변수]
      -sessions: 
        클라는 반드시 자신의 uuid를 담아서 패킷을 전송하므로
        빠르게 session을 가져오기 위해 Map선택
---------------------------------------------*/
  public sessions: Map<string, T>;
  private sessionFactory: SessionFactory<T>;
  private roundRobinIndex: number = 0;
  /*---------------------------------------------
    [생성자]
---------------------------------------------*/
  constructor(sessionFactory: SessionFactory<T>) {
    this.sessions = new Map<string, T>();
    this.sessionFactory = sessionFactory;
  }

  /*---------------------------------------------
    [세션 추가]
---------------------------------------------*/
  addSession(uuid: string, socket: Socket): T {
    let session = new this.sessionFactory(socket);
    session.setId(uuid);
    this.sessions.set(uuid, session);
    return session;
  }

  /*---------------------------------------------
    [세션 제거]
---------------------------------------------*/
  removeSession(uuid: string): boolean {
    const ret = this.sessions.delete(uuid);
    return ret;
  }
  /*---------------------------------------------
      [getter]
  ---------------------------------------------*/
  getSessionOrNull(uuid: string): T | null {
    return this.sessions.get(uuid) || null;
  }

  getNextSequenceOrNull(uuid: string): number | null {
    const session: Session | null = this.getSessionOrNull(uuid);
    if (!session) {
      return null;
    }

    return session.getNextSequence();
  }

  getRandomSession(): T | null {
    const sessionArray = Array.from(this.sessions.values());
    if (sessionArray.length === 0) {
      return null;
    }

    const session = sessionArray[this.roundRobinIndex];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % sessionArray.length;

    return session;
  }
}
