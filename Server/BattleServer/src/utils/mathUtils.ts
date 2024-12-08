import { create } from "@bufbuild/protobuf";
import { Vec2 } from "ServerCore/utils/vec2";
import { PosInfo, PosInfoSchema } from "src/protocol/struct_pb";


export class MathUtils {
    static clamp(v: number, lo: number, hi: number){
      return  Math.max(lo, Math.min(v, hi))
    }

    static isSamePosition(playerPos: PosInfo | undefined, pos: Vec2): boolean {
      return playerPos?.x === pos.x && playerPos?.y === pos.y;
    }

    static calcPosDiff(lhs: PosInfo, rhs: PosInfo): PosInfo{
      return create(PosInfoSchema, {
        x: lhs.x-rhs.x, 
        y: lhs.y-rhs.y
      });
    }

    static randomRangeInt(min: number, max: number){
      return Math.floor(Math.random()*(max-min)+min);
    }
  }
  