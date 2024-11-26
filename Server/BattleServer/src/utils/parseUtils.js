import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export class ParseUtils {
  static basePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../assets");

  /*---------------------------------------------
    [비동기 파일 읽기]
  ---------------------------------------------*/
  static async readFileAsync(filename) {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(ParseUtils.basePath, filename), "utf8", (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (parseErr) {
          reject(parseErr);
        }
      });
    });
  }
}
