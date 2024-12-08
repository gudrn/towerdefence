import { Vec2 } from "ServerCore/utils/vec2";

export enum Tile{
    None = 0,
    Base = 1,
    Tower = 2,
    Monster = 3,
    Obstacle = 4,
};

export class Tilemap {
/*---------------------------------------------
  [멤버 변수]
---------------------------------------------*/
    private mapSize: Vec2;
    private tiles: Array<Array<Tile>>;

/*---------------------------------------------
  [멤버 변수]
---------------------------------------------*/
 constructor(basePos: Vec2){
  this.mapSize = {x: 32, y: 32};
  this.tiles = new Array<Array<Tile>>(32);
  for(let i = 0; i < 32; i += 1){
    this.tiles[i] = new Array<Tile>(32).fill(Tile.None);
  }

  
  for(let y = basePos.y-1; y <= basePos.y+1; y += 1){
    for(let x = basePos.x-1; x <= basePos.x+1; x += 1){
      this.tiles[y][x] = Tile.Base;
    }
  }
 }  

 public getTile(pos: Vec2): Tile | null {
  // 범위 확인
  if (pos.x < 0 || pos.x >= this.mapSize.x || pos.y < 0 || pos.y >= this.mapSize.y) {
      return null;
  }

  return this.tiles[pos.y][pos.x];
}

 public setTile(pos: Vec2, tile: Tile): void {
  this.tiles[pos.y][pos.x] = tile;
 }

 public getMapSize(): number{
  return this.mapSize.x * this.mapSize.y;
 }
}