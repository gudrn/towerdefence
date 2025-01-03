export const ErrorCodes = {
  NONE_FAILCODE: 0,
  UNKNOWN_ERROR: 1,
  INVALID_REQUEST: 2,
  AUTHENTICATION_FAILED: 3,
  CREATE_ROOM_FAILED: 4,
  JOIN_ROOM_FAILED: 5,
  LEAVE_ROOM_FAILED: 6,
  REGISTER_FAILED: 7,
  ROOM_NOT_FOUND: 8,
  CHARACTER_NOT_FOUND: 9,
  CHARACTER_STATE_ERROR: 10,
  CHARACTER_NO_CARD: 11,
  INVALID_ROOM_STATE: 12,
  NOT_ROOM_OWNER: 13,
  ALREADY_USED_ROOM: 14,
  INVALID_PHASE: 15,
  CHARACTER_CONTAINED: 16,
  ROOM_LIMIT_REACHED: 17,
  INVALID_ROOM_ID: 18,
  ROOM_FULL: 19,
  SERVER_NOT_INIT: 20,
  SERSSION_NOT_FOUND: 21,
  CLIENT_VERSION_MISMATCH: 1000,
  SOCKET_ERROR: 10000,
  INVALID_PACKET_ID: 10001,
  PACKET_DECODE_ERROR: 10003,
  PACKET_STRUCTURE_MISMATCH: 10004,
  MISSING_FIELDS: 10005,
  USER_NOT_FOUND: 10006,
  INVALID_PACKET: 10007,
  INVALID_SEQUENCE: 10008,
  // 추가적인 에러 코드들
};
