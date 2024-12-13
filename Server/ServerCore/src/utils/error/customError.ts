export class CustomError extends Error {
  /*---------------------------------------------
    [멤버 변수]
---------------------------------------------*/
  public code: number;
  public name: string;

  /*---------------------------------------------
    [생성자]
---------------------------------------------*/
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = "CustomError";
  }
}
