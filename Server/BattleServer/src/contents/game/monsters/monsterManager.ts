import { PosInfo } from 'src/protocol/struct_pb';
import { GameRoom } from '../../room/gameRoom';
import { MonsterSpawner } from './monsterSpanwner';
import { Vec2 } from 'ServerCore/utils/vec2';
import { Tilemap } from '../../room/tilemap';
import { PQNode } from 'src/utils/interfaces/assetPQnode';
import { create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { B2G_SpawnMonsterNotificationSchema } from 'src/protocol/monster_pb';
import { MathUtils } from 'src/utils/mathUtils';
import { Monster } from './monster';

export class MonsterManager {
  /*---------------------------------------------
    [멤버 변수]
  ---------------------------------------------*/
  private monsters: Map<string, Monster>;
  private tilemap: Tilemap;
  private numBuffMonsters: number = 0;
  private monsterSpawner: MonsterSpawner;
  private gameRoom: GameRoom;

  /*---------------------------------------------
    [생성자]
  ---------------------------------------------*/
  constructor(gameRoom: GameRoom, tilemap: Tilemap) {
    this.gameRoom = gameRoom;
    this.monsterSpawner = new MonsterSpawner(this);
    this.monsters = new Map<string, Monster>();
    this.tilemap = tilemap;
  }

  /*---------------------------------------------
    [일반 몬스터 스폰]
  ---------------------------------------------*/
  public startSpawning() {
    this.monsterSpawner.startSpawning();
  }

  /*---------------------------------------------
    [엘리트 몬스터 스폰]
  ---------------------------------------------*/
  public spawnEilteMonster() {
    this.monsterSpawner.spawnMonster(true);
  }

  /*---------------------------------------------
    [일반 몬스터 스폰 중단]
  ---------------------------------------------*/
  public stopSpawning() {
    this.monsterSpawner.stopSpawning();
  }

  /*---------------------------------------------
    [update]
  ---------------------------------------------*/
  public updateMonsters() {
    for (const [uuid, monster] of this.monsters) {
      monster.update();
    }
  }

  /*---------------------------------------------
    [몬스터 추가]
  ---------------------------------------------*/
  public addMonster(monster: Monster) {
    this.monsters.set(monster.getId(), monster);
    
    //버프 몬스터 수 갱신
    if(monster.getPrefabId() == "Robot5") {
      this.numBuffMonsters += 1;
    }

    // [TODO] 큐에 담았다가 일정 시간 경과 시 한 패킷으로 보내는 방법으로 구현해보기
    const packet = create(B2G_SpawnMonsterNotificationSchema, {
      posInfo: monster.getPos(),
      prefabId: monster.getPrefabId(),
      maxHp: monster.maxHp,
      roomId: this.gameRoom.id,
    });

    const sendBuffer: Buffer = PacketUtils.SerializePacket(
      packet,
      B2G_SpawnMonsterNotificationSchema,
      ePacketId.B2G_SpawnMonsterNotification,
      0,
    );
    this.gameRoom.broadcast(sendBuffer);
  }

  /*---------------------------------------------
    [몬스터 제거]
      - robot5(버프 몬스터)의 생존여부를 확인해야 합니다.
  ---------------------------------------------*/
  public removeMonster(uuid: string) {
    const monster = this.monsters.get(uuid);

    if(monster?.getPrefabId() === 'Robot5'){
      this.numBuffMonsters -= 1;
    }
    this.monsters.delete(uuid);
  }

  public increaseWave() {
    this.monsterSpawner.increaseWave();
  }

  public destroy() {
    this.monsters.clear();
    this.monsterSpawner.destroy();
  }

  /*---------------------------------------------
    [길찾기]
    -findPath
    -parseKey
    -canGo 
  ---------------------------------------------*/
  public findPath(src: Vec2, dest: Vec2): Vec2[] | null {
    const path: Vec2[] = [];

    const pq: PQNode[] = [];
    const best: Map<string, number> = new Map();
    const parent: Map<string, Vec2> = new Map();

    const key = (vec: Vec2) => `${vec.x},${vec.y}`;
    // 초기값 설정
    {
      const cost = Math.abs(dest.y - src.y) + Math.abs(dest.x - src.x);
      pq.push({ cost, pos: src });
      best.set(key(src), cost);
      parent.set(key(src), src);
    }
    const directions = [
      { x: 0, y: -1 }, // 북
      { x: 0, y: 1 }, // 남
      { x: -1, y: 0 }, // 서
      { x: 1, y: 0 }, // 동
      { x: -1, y: -1 }, // 북서
      { x: 1, y: -1 }, // 북동
      { x: -1, y: 1 }, // 남서
      { x: 1, y: 1 }, // 남동
    ];

    let found = false;

    while (pq.length > 0) {
      // 우선순위 큐에서 최소 비용 노드 선택
      pq.sort((a, b) => a.cost - b.cost);
      const node = pq.shift()!;

      const nodeKey = key(node.pos);

      // 더 짧은 경로를 뒤늦게 찾았다면 스킵
      if ((best.get(nodeKey) ?? Infinity) < node.cost) continue;

      // 목적지에 도착했으면 종료
      if (node.pos.x === dest.x && node.pos.y === dest.y) {
        found = true;
        break;
      }

      // 방문
      for (const dir of directions) {
        const nextPos: Vec2 = {
          x: node.pos.x + dir.x,
          y: node.pos.y + dir.y,
        };

        const nextKey = key(nextPos);

        // 대각선 이동 시  막혀있는 곳은 없는지 검사
        if (dir.x !== 0 && dir.y !== 0) {
          const adjacent1 = { x: node.pos.x + dir.x, y: node.pos.y };
          const adjacent2 = { x: node.pos.x, y: node.pos.y + dir.y };

          if (!this.canGo(adjacent1) || !this.canGo(adjacent2)) {
            continue; // 양쪽 경로 중 하나라도 막혀 있으면 대각선 이동 불가
          }
        }

        if (!this.canGo(nextPos)) continue;

        const cost = Math.abs(dest.y - nextPos.y) + Math.abs(dest.x - nextPos.x);
        const bestValue = best.get(nextKey);

        if (bestValue !== undefined && bestValue <= cost) continue;

        // 예약 진행
        best.set(nextKey, cost);
        pq.push({ cost, pos: nextPos });
        parent.set(nextKey, node.pos);
      }
    }

    if (!found) {
      let bestScore = Number.MAX_VALUE;

      for (const [posKey, score] of best.entries()) {
        const pos = this.parseKey(posKey);

        // 동점이라면 최초 위치에서 가장 덜 이동하는 쪽으로
        if (bestScore === score) {
          const dist1 = Math.abs(dest.x - src.x) + Math.abs(dest.y - src.y);
          const dist2 = Math.abs(pos.x - src.x) + Math.abs(pos.y - src.y);
          if (dist1 > dist2) dest = pos;
        } else if (bestScore > score) {
          dest = pos;
          bestScore = score;
        }
      }
    }

    let pos = dest;
    while (true) {
      path.push(pos);

      const parentPos = parent.get(key(pos));
      if (!parentPos || (pos.x === parentPos.x && pos.y === parentPos.y)) break;

      pos = parentPos;
    }

    path.reverse();
    return path;
  }

  private parseKey(key: string): Vec2 {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  public canGo(pos: Vec2): boolean;
  public canGo(pos: PosInfo) {
    const tile = this.tilemap.getTile(pos);
    return tile !== null;
  }

  /*---------------------------------------------
    [getter]
  ---------------------------------------------*/
  public getMonsterCount() {
    return this.monsters.size;
  }

  public getMonsters() {
    return this.monsters;
  }

  public getGameRoom(){
    return this.gameRoom;
  }

  public getMonster(uuid: string) {
    return this.monsters.get(uuid);
  }
}
