import { Socket } from "net";
import { config } from "../config/config";
import { PacketUtils } from "../utils/packetUtils";
import { PacketHeader } from "./packetHeader";

export abstract class Session {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  protected socket: Socket;
  protected buffer: Buffer;
  protected id: string = "";
  protected sequence: number = 0;

  /*---------------------------------------------
    [생성자]
---------------------------------------------*/
  constructor(socket: Socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this._init();
  }

  /*---------------------------------------------
    [소켓 이벤트 설정]
    1. data: 요청을 처리하거나 응답을 준비
    2. end: 자원을 정리하거나 로그를 남기기
    3. error: 예외 상황을 적절히 처리하고 로그를 남기거나 대응을 하기
---------------------------------------------*/
  private _init() {
    this.socket.removeAllListeners();
    this.socket.on("data", (data: Buffer) => this.onData(data));
    this.socket.on("end", () => this.onEnd());
    this.socket.on("error", (error: any) => this.onError(error));
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
  private onData(buffer: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, buffer]);
    //최소한 헤더는 파싱할 수 있어야 한다
    while (this.buffer.length >= config.packet.sizeOfHeader) {
      let header: PacketHeader = PacketUtils.readPacketHeader(this.buffer);
      // 헤더에 기록된 패킷 크기를 파싱할 수 있어야 한다
      if (this.buffer.length < header.size) {
        console.log("파싱X", this.buffer.length, header.size);
        break;
      }

      const packet = this.buffer.subarray(
        config.packet.sizeOfHeader,
        header.size
      );
      this.buffer = this.buffer.subarray(header.size);
      //패킷 조립 성공
      //console.log("패킷 조립 성공", header);

      this.handlePacket(packet, header);
    }
  }

  /*---------------------------------------------
    [onEnd]
    - 발생 조건: 상대방이 FIN패킷을 보냈을 때 
    - 목적: 자원을 정리하거나 로그를 남기기
---------------------------------------------*/
  protected abstract onEnd(): void;

  /*---------------------------------------------
    [onError]
    - 발생 조건: 에러가 발생했을 때
    - 목적: 예외 상황을 적절히 처리하고 로그를 남기거나 대응을 하기
    
    - 이 이벤트 이후 곧바로 close이벤트 호출
---------------------------------------------*/
  protected abstract onError(error: any): void;

  public onInit(): void {}

  /*---------------------------------------------
    [handlePacket]
    - 목적: 수신한 패킷의 Id에 맞는 함수 호출

    1. sequence 검증
    2. 패킷 ID에 해당하는 핸들러 확인
      2-1. 핸들러가 존재하지 않을 경우 오류 출력
    3. 핸들러 호출

---------------------------------------------*/
  protected abstract handlePacket(
    packet: Buffer,
    header: PacketHeader
  ): Promise<void>;

  /*---------------------------------------------
    [getter]
---------------------------------------------*/
  getSequence() {
    return this.sequence;
  }

  getNextSequence() {
    return ++this.sequence;
  }

  public getId(): string {
    return this.id;
  }
  /*---------------------------------------------
    [setter]
---------------------------------------------*/
  setSequence(sequence: number) {
    this.sequence = sequence;
  }

  setId(id: string) {
    this.id = id;
  }

  /*---------------------------------------------
    [비동기 패킷 전송]
---------------------------------------------*/
  public send(sendBuffer: Buffer) {
    this.socket.write(sendBuffer);
  }
}

