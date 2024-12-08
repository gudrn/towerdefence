"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const config_1 = require("../config/config");
const packetUtils_1 = require("../utils/packetUtils");
class Session {
    /*---------------------------------------------
      [생성자]
  ---------------------------------------------*/
    constructor(socket) {
        this.id = "";
        this.sequence = 0;
        this.socket = socket;
        this.buffer = Buffer.alloc(0);
        this.init();
    }
    /*---------------------------------------------
      [소켓 이벤트 설정]
      1. data: 요청을 처리하거나 응답을 준비
      2. end: 자원을 정리하거나 로그를 남기기
      3. error: 예외 상황을 적절히 처리하고 로그를 남기거나 대응을 하기
  ---------------------------------------------*/
    init() {
        this.socket.removeAllListeners();
        this.socket.on("data", (data) => this.onData(data));
        this.socket.on("end", () => this.onEnd());
        this.socket.on("error", (error) => this.onError(error));
    }
    /*---------------------------------------------
      [onData]
      - 발생 조건: 클라이언트로부터 데이터가 수신될 때
      - 목적: 요청을 처리하거나 응답을 준비
  
      1. 수신한 버퍼와 기존의 버퍼를 합치기
      2. 온전한 패킷을 수신했는지 확인
          2-1. 아직 덜 도착했다면 break
      3. 패킷의 크기만큼 버퍼를 줄이고, handler함수 호출
  ---------------------------------------------*/
    onData(buffer) {
        this.buffer = Buffer.concat([this.buffer, buffer]);
        //최소한 헤더는 파싱할 수 있어야 한다
        while (this.buffer.length >= config_1.config.packet.sizeOfHeader) {
            let header = packetUtils_1.PacketUtils.readPacketHeader(this.buffer);
            // 헤더에 기록된 패킷 크기를 파싱할 수 있어야 한다
            if (this.buffer.length < header.size) {
                console.log("파싱X", this.buffer.length, header.size);
                break;
            }
            const packet = this.buffer.subarray(config_1.config.packet.sizeOfHeader, header.size);
            this.buffer = this.buffer.subarray(header.size);
            //패킷 조립 성공
            //console.log("패킷 조립 성공", header);
            this.handlePacket(packet, header);
        }
    }
    onInit() { }
    /*---------------------------------------------
      [getter]
  ---------------------------------------------*/
    getSequence() {
        return this.sequence;
    }
    getNextSequence() {
        return ++this.sequence;
    }
    getId() {
        return this.id;
    }
    /*---------------------------------------------
      [setter]
  ---------------------------------------------*/
    setSequence(sequence) {
        this.sequence = sequence;
    }
    setId(id) {
        this.id = id;
    }
    /*---------------------------------------------
      [비동기 패킷 전송]
  ---------------------------------------------*/
    send(sendBuffer) {
        this.socket.write(sendBuffer);
    }
}
exports.Session = Session;
//# sourceMappingURL=session.js.map