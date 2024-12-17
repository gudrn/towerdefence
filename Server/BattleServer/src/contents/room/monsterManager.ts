import { PosInfo } from 'src/protocol/struct_pb';
import { GameRoom } from './gameRoom';
import { MonsterSpawner } from './monsterSpanwner';
import { Vec2 } from 'ServerCore/utils/vec2';
import { Tilemap } from './tilemap';
import { PQNode } from 'src/utils/interfaces/assetPQnode';
import { SkillUseMonster } from '../game/skillUseMonster';
import { create } from '@bufbuild/protobuf';
import { PacketUtils } from 'ServerCore/utils/packetUtils';
import { ePacketId } from 'ServerCore/network/packetId';
import { B2G_MonsterBuffNotificationSchema } from 'src/protocol/monster_pb';
import { MathUtils } from 'src/utils/mathUtils';

export class MonsterManager extends MonsterSpawner {
  private monsters: Map<string, SkillUseMonster>;
  private tilemap: Tilemap;
  private attackCoolDownBuffer: boolean = false; // 공격 속도 버프 상태 여부
  private attackUpBuffer: boolean = false; // 공격력 버프 상태 여부

  constructor(gameRoom: GameRoom, tilemap: Tilemap) {
    super(gameRoom);
    this.monsters = new Map<string, SkillUseMonster>();
    this.tilemap = tilemap;
  }

  public startSpawning() {
    super.startSpawning();
  }

  public updateMonsters() {

    if(this.eliteSpawnCount>0&&!this.attackUpBuffer){
      this.attackUpBuffer = true;
      for(const monster of this.monsters.values()){
        monster.buffAttack();
        const packet = create(B2G_MonsterBuffNotificationSchema, {
          buffType: 'atkBuff',
          state: true,
          roomId: this.gameRoom.id,
        });
        const createAttackBuffBuffer = PacketUtils.SerializePacket(
          packet,
          B2G_MonsterBuffNotificationSchema,
          ePacketId.B2G_MonsterBuffNotification,
          0,
        );
        this.gameRoom.broadcast(createAttackBuffBuffer);
      }
    }
    else if(this.eliteSpawnCount===0 && this.attackUpBuffer){
      this.attackUpBuffer = false;
      for(const monster of this.monsters.values()){
        monster.removeBuff();
        const packet = create(B2G_MonsterBuffNotificationSchema, {
          buffType: 'atkBuff',
          state: false,
          roomId: this.gameRoom.id,
        });
        const createAttackBuffBuffer = PacketUtils.SerializePacket(
          packet,
          B2G_MonsterBuffNotificationSchema,
          ePacketId.B2G_MonsterBuffNotification,
          0,
        );
        this.gameRoom.broadcast(createAttackBuffBuffer);
      }
    }
    // let packet;
    // for (const monster of this.monsters.values()) {
    //   // 공격력 버프
    //   if (hasRobot5 && !monster.getIsAttackUpBuffed()) {
    //     monster.buffAttack();
    //     packet = create(B2G_MonsterBuffNotificationSchema, {
    //       buffType: 'atkBuff',
    //       state: true,
    //       roomId: this.gameRoom.id,
    //     });
    //     const createAttackBuffBuffer = PacketUtils.SerializePacket(
    //       packet,
    //       B2G_MonsterBuffNotificationSchema,
    //       ePacketId.B2G_MonsterBuffNotification,
    //       0,
    //     );
    //     this.gameRoom.broadcast(createAttackBuffBuffer);
    //   } else if (!hasRobot5 && monster.getIsAttackUpBuffed()) {
        
    //   }
    // }
  }

  public addMonster(monster: SkillUseMonster) {
    this.monsters.set(monster.getId(), monster);
    // 몬스터 추가 시 필요한 로직
  }

  public removeMonster(uuid: string) {
    const monster = this.monsters.get(uuid);
    if(monster?.getPrefabId() === 'Robot5'){
      this.eliteSpawnCount -= 1;
    }
    this.monsters.delete(uuid);
    // 몬스터 제거 시 필요한 로직
  }

  public getMonsterCount() {
    return this.monsters.size;
  }

  public getMonsters() {
    return this.monsters;
  }

  public stopSpawning() {
    super.stopSpawning();
  }

  public destroy() {
    this.monsters.clear();
    super.destroy();
  }

  public getMonster(uuid: string) {
    return this.monsters.get(uuid);
  }

  /*---------------------------------------------
    [길찾기]
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

  public increaseWave() {
    this.updateSpawnRate(MathUtils.clamp(this.spawnRate - 500, 100, this.spawnRate));
  }
}
