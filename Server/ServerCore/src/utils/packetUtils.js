"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketUtils = void 0;
const config_1 = require("../config/config");
const protobuf_1 = require("@bufbuild/protobuf");
class PacketUtils {
    /*---------------------------------------------
      [헤더 파싱]
  ---------------------------------------------*/
    static readPacketHeader(buffer) {
        const size = buffer.readUInt16LE(0); //2바이트
        const id = buffer.readUInt16LE(config_1.config.packet.sizeOfSize); // 2바이트
        const sequence = buffer.readUint32LE(config_1.config.packet.sizeOfSequence);
        return { size, id, sequence };
    }
    /**---------------------------------------------
     * 패킷을 직렬화하여 Buffer 반환
     * @param {Message} packet - 직렬화할 패킷
     * @param {Object} packetSchema - 패킷 스키마
     * @param {number} id - 패킷 ID
     * @param {number} sequence - 패킷 시퀀스
     * @returns {Buffer} 직렬화된 패킷 버퍼
     ---------------------------------------------*/
    static SerializePacket(packet, packetSchema, id, sequence) {
        const packetBuffer = (0, protobuf_1.toBinary)(packetSchema, packet);
        //헤더 크기 + 가변 길이의 패킷 크기
        const sendBufferSize = config_1.config.packet.sizeOfHeader + packetBuffer.byteLength;
        //헤더 크기+패킷 크기만큼 버퍼 할당
        const sendBuffer = Buffer.alloc(sendBufferSize);
        const header = sendBuffer.subarray(0, config_1.config.packet.sizeOfHeader);
        //size 삽입
        header.writeUInt16LE(sendBufferSize);
        //id 삽입
        header.writeUInt16LE(id, config_1.config.packet.sizeOfSize);
        //sequence 삽입
        header.writeUInt32LE(sequence, config_1.config.packet.sizeOfSize + config_1.config.packet.sizeOfId);
        //packetBuffer랑 합치기
        Buffer.from(packetBuffer).copy(sendBuffer, config_1.config.packet.sizeOfHeader);
        return sendBuffer;
    }
}
exports.PacketUtils = PacketUtils;
//# sourceMappingURL=packetUtils.js.map