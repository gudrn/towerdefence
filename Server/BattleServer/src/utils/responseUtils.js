import { create } from "@bufbuild/protobuf";
import { S2C_MetadataSchema, S2C_ErrorSchema } from "../protocol/server_pb.js";
export class ResponseUtils {
  static createMetaResponse(responseCode) {
    const ret = create(S2C_MetadataSchema, {
      timestamp: BigInt(Date.now()),
      responseCode: responseCode,
    });

    return ret;
  }

  static createErrorResponse(responseCode, message) {
    const ret = create(S2C_ErrorSchema, {
      meta: ResponseUtils.createMetaResponse(responseCode),
      message,
    });

    return ret;
  }
}