import { Vec2 } from "ServerCore/src/utils/vec2.js";

/**
 * @readonly
 * @enum {number}
 */
export const Tile = {
    None: 0,
    Base: 1,
    Tower: 2,
    Monster: 3,
};

export class Tilemap {
    /*---------------------------------------------
      [멤버 변수]
    ---------------------------------------------*/
    /**
     * @type {Vec2} 맵의 크기 (x, y 좌표).
     */
    mapSize;

    /**
     * @type {Tile[][]} 타일 데이터 배열.
     */
    tiles;

    /**---------------------------------------------
     * [생성자]
     * @param {Vec2} basePos - Base의 위치.
     */
    //---------------------------------------------
    constructor(basePos) {
        this.mapSize = { x: 32, y: 32 };
        this.tiles = new Array(32);
        for (let i = 0; i < 32; i += 1) {
            this.tiles[i] = new Array(32).fill(Tile.None);
        }

        // Base 영역 설정
        for (let y = basePos.y - 1; y <= basePos.y + 1; y += 1) {
            for (let x = basePos.x - 1; x <= basePos.x + 1; x += 1) {
                this.tiles[y][x] = Tile.Base;
            }
        }
    }

    /**
     * @param {Vec2} pos 
     * @returns {Tile|null}
     */
    getTile(pos) {
        // 범위 확인
        if (pos.x < 0 || pos.x >= this.mapSize.x || pos.y < 0 || pos.y >= this.mapSize.y) {
            return null;
        }
        return this.tiles[pos.y][pos.x];
    }

    /**
     * @param {Vec2} pos
     * @param {Tile} tile - 설정할 타일 값.
     */
    setTile(pos, tile) {
        this.tiles[pos.y][pos.x] = tile;
    }

    /**
     * @returns {number} 맵의 전체 크기 (x * y).
     */
    getMapSize() {
        return this.mapSize.x * this.mapSize.y;
    }
}
