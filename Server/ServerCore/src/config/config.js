"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.RESPONSE_SUCCESS_CODE = void 0;
const SIZEOF_SIZE = 2;
const SIZEOF_ID = 2;
const SIZEOF_SEQUENCE = 4;
exports.RESPONSE_SUCCESS_CODE = 0;
exports.config = {
    packet: {
        sizeOfSize: SIZEOF_SIZE,
        sizeOfId: SIZEOF_ID,
        sizeOfSequence: SIZEOF_SEQUENCE,
        sizeOfHeader: SIZEOF_SIZE + SIZEOF_ID + SIZEOF_SEQUENCE,
    },
};
//# sourceMappingURL=config.js.map