import path from "path";
import fs from "fs";

export class ParseUtils {
    static basePath: string = path.join(__dirname, "../../assets");
  
    /*---------------------------------------------
      [비동기 파일 읽기]
  ---------------------------------------------*/
    static async readFileAsync(filename: string): Promise<any> {
      return new Promise((resolve, reject) => {
        fs.readFile(path.join(ParseUtils.basePath, filename), "utf8", (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(JSON.parse(data));
        });
      });
    }
}