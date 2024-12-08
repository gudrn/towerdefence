"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    /*---------------------------------------------
      [생성자]
  ---------------------------------------------*/
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "CustomError";
    }
}
exports.CustomError = CustomError;
//# sourceMappingURL=customError.js.map