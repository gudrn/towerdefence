

export class MathUtils {
    static clamp(v, lo, hi){
      return  Math.max(lo, Math.min(v, hi))
    }

    static isSamePosition(playerPos, pos) {
      return playerPos?.x === pos.x && playerPos?.y === pos.y;
    }

    static calcPosDiff(lhs, rhs){
      return create(PosInfoSchema, {
        x: lhs.x-rhs.x, 
        y: lhs.y-rhs.y
      });
    }

    static randomRangeInt(min, max){
      return Math.floor(Math.random()*(max-min)+min);
    }
  }
  