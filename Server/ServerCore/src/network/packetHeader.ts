import { ePacketId } from './packetId';


export interface PacketHeader {
  size: number;
  id: ePacketId;
  sequence: number;
}
