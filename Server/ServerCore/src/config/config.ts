const SIZEOF_SIZE = 2;
const SIZEOF_ID = 2;
const SIZEOF_SEQUENCE = 4;

export const RESPONSE_SUCCESS_CODE = 0;

export const config = {
  packet: {
    sizeOfSize: SIZEOF_SIZE,
    sizeOfId: SIZEOF_ID,
    sizeOfSequence: SIZEOF_SEQUENCE,
    sizeOfHeader: SIZEOF_SIZE + SIZEOF_ID + SIZEOF_SEQUENCE,
  },
};
