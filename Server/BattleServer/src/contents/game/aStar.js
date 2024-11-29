import { Vec2 } from "ServerCore/src/utils/vec2.js";

class PriorityQueue {
  // PriorityQueue는 우선순위 큐로 우선순위따라 좌표 처리를 함
  constructor() {
    this.elements = []; // 여기에 [{ pos, priority }, { pos, priority }] 형태로 배열들이 저장 됨.
  }

  enqueue(pos, priority) {
    this.elements.push({ pos, priority }); // {pos, priority} 객체 추가
    this.elements.sort((a, b) => a.priority - b.priority); // 우선순위 기준 정렬
  }

  dequeue() {
    return this.elements.shift().pos; // 가장 우선순위가 높은 항목의 pos를 반환 및 삭제
  }

  isEmpty() {
    return this.elements.length === 0; // 배열이 비었는지 확인
  }
} // PriorityQueue를 통하여 전체적인 탐색 효율 향상.

/**
 @param {Vec2} start - 시작 지점 (객체 {x, y} 형태)
 @param {Vec2} goal - 목표 지점 (객체 {x, y} 형태)
 @param {string} grid - 탐색할 전체 맵의 크기 ({width, height} 형태)
 @param {Array} obstacles - 장애물 목록 (객체 배열 [ {x, y}, ... ])
 @param {number} size - 오브젝트 크기 (이번 프로젝트에서는 몬스터)
**/

export function aStar(start, goal, grid, obstacles, size) {
  const openSet = new PriorityQueue(); // openSet을 PriorityQueue로 변경
  openSet.enqueue(start, 0); // 시작 지점을 priority 0으로 큐에 추가.

  const gScore = {};
  const fScore = {};

  gScore[`${start.x},${start.y}`] = 0; // 시작점에서 각 노드까지의 실제 이동 비용. 노드는 격자의 위치를 뜻함.
  fScore[`${start.x},${start.y}`] = heuristic(start, goal); // 시작점에서 목표까지의 예상 총 비용 f = g + h.

  const cameFrom = {}; // 각 노드의 이전 노드를 기록. 나중에 경로를 재구성할 때 사용.

  while (!openSet.isEmpty()) {
    // while을 통해 openSet이 비어있을 때까지 반복.
    const current = openSet.dequeue(); // dequeue를 통해 현재 처리할 노드를 선택. 선택 노드는 fScore가 가장 작은 노드가 될 것.

    // 현재 노드가 목표 지점과 같다면, cameFrom을 사용해 경로를 재구성하고 반환.
    if (current.x === goal.x && current.y === goal.y) {
      return reconstructPath(cameFrom, current);
    }

    const neighbors = getNeighbors(current, grid, obstacles, size); // getNeighbors를 통해 현재 노드의 인접한 상하좌우 및 대각선 노드를 반환.

    for (const neighbor of neighbors) {
      // tentativeGScore로 현재 노드까지의 이동 비용(g) + 현재 노드에서 이웃 노드로 이동하는 비용(distance 함수 활용).
      const tentativeGScore = gScore[`${current.x},${current.y}`] + distance(current, neighbor);

      // 만약 더 작은 gScore를 발견할 시의 함수
      if (tentativeGScore < (gScore[`${neighbor.x},${neighbor.y}`] || Infinity)) {
        cameFrom[`${neighbor.x},${neighbor.y}`] = current; // cameFrom에 현재 노드를 기록.
        gScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore; // gScore를 갱신.
        fScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore + heuristic(neighbor, goal); // fScore도 새롭게 계산.

        // neighbor가 아직 openSet에 없으면 큐에 추가.
        if (!openSet.elements.some((e) => e.pos.x === neighbor.x && e.pos.y === neighbor.y)) {
          openSet.enqueue(neighbor, fScore[`${neighbor.x},${neighbor.y}`]);
        }
      }
      // 시작점은 이전 노드가 없도록 명확히 정의
      cameFrom[`${start.x},${start.y}`] = null;
    }
  }

  return []; // 탐색이 완료될 때까지 목표를 찾지 못하면 빈 배열 반환.
}


  /**
    @param {Vec2} node - 시작 지점 (객체 {x, y} 형태)
    @param {Vec2} goal - 목표 지점 (객체 {x, y} 형태)
    **/
function heuristic(node, goal) {
  // 대각선 이동을 반영하기 위한 휴리스틱 (Chebyshev distance - 체비쇼프 거리 = 체스판 거리)
  const dx = Math.abs(node.x - goal.x);
  const dy = Math.abs(node.y - goal.y);
  return Math.max(dx, dy); // 가장 큰 좌표 차이(dx, dy)를 반환.
}

function distance(nodeA, nodeB) {
  // 이동의 실제 거리를 알기 위해 abs를 사용
  const dx = Math.abs(nodeA.x - nodeB.x);
  const dy = Math.abs(nodeA.y - nodeB.y);
  // 상하좌우 이동의 거리는 1, 대각선 이동의 거리는 √2로 반환.
  return dx === 1 && dy === 1 ? Math.sqrt(2) : 1;
}

function getNeighbors(node, grid, obstacles, size) {
  const neighbors = []; // neighbors는 현재 위치에서 이동 가능한 모든 인접 좌표를 배열.
  const directions = [
    { x: 0, y: -1 }, // 상
    { x: 0, y: 1 }, // 하
    { x: -1, y: 0 }, // 좌
    { x: 1, y: 0 }, // 우
    { x: -1, y: -1 }, // 좌상
    { x: 1, y: -1 }, // 우상
    { x: -1, y: 1 }, // 좌하
    { x: 1, y: 1 }, // 우하
  ];

  // directions 배열을 순회하며, 각 방향에 대해 이웃 노드를 계산하는 반복문
  for (const dir of directions) {
    /**
     * 현재 노드에서 이동한 좌표를 계산하는 함수.
     * node는 현재 노드의 좌표.
     * dir은 특정 방향으로 이동할 때의 좌표 변화량
     * */
    const neighbor = { x: node.x + dir.x, y: node.y + dir.y };
    // 계산된 이웃 노드가 유효한지 확인
    if (isInGrid(neighbor, grid, size) && !isObstacle(neighbor, obstacles, size)) {
      /**
       * 대각선 이동 추가 검사
       * 현재 이동하려는 방향(dir.x와 dir.y)이 대각선 방향인지 확인
       * */
      if (Math.abs(dir.x) === 1 && Math.abs(dir.y) === 1) {
        /**
         * 대각선 이동의 경우, 양쪽 경로가 비어 있어야 함
         * adj는 adjacency로 인접을 뜻함.
         * 즉, 장애물의 대각선이 인접하여 막혀있다면 우회하게함.
         * */
        const adj1 = { x: node.x + dir.x, y: node.y }; // 가로 방향
        const adj2 = { x: node.x, y: node.y + dir.y }; // 세로 방향
        /**
         * x나 y이동시 한 쪽이라도 막혀 있으면 대각선 이동을 불가능하게 함.
         * 그 후 continue를 통해 대각선 방향을 빼고 다른 방향을 확인.
         * */
        if (isObstacle(adj1, obstacles, size) || isObstacle(adj2, obstacles, size)) {
          continue;
        }
      }
      neighbors.push(neighbor);
    }
  }

  return neighbors;
}

// isInGrid는 이웃 노드가 grid 범위 내에 있는지 확인.
function isInGrid(node, grid, size) {
  // Grid 중심을 기준으로 음수 범위를 계산
  const gridMinX = -Math.floor(grid.width / 2);
  const gridMinY = -Math.floor(grid.height / 2);
  const gridMaxX = Math.floor(grid.width / 2);
  const gridMaxY = Math.floor(grid.height / 2);

  // dx와 dy로 몬스터 크기를 고려하여 모든 셀이 그리드 내에 있는지 확인
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      const checkX = node.x + dx;
      const checkY = node.y + dy;

      if (checkX < gridMinX || checkX >= gridMaxX || checkY < gridMinY || checkY >= gridMaxY) {
        return false;
      }
    }
  }
  return true;
}

// isObstacle은 이웃 노드가 장애물(obstacle)인지 확인.
function isObstacle(node, obstacles, size) {
  // dx와 dy로 몬스터가 이동 할 시, 차지하는 모든 셀 중 하나라도 장애물과 겹치는지 확인
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      if (obstacles.some((obs) => obs.x === node.x + dx && obs.y === node.y + dy)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 목표에서 시작점까지 cameFrom을 따라가며 경로를 역추적하는 함수.
 * current는 경로 재구성을 시작할 목표 노드.
 * */
function reconstructPath(cameFrom, current) {
  // path를 생성하고 current(목표지점)를 배열의 첫 번째 요소로 추가
  const path = [current];
  const visited = new Set();

  // 현재 노드 current가 cameFrom에 존재하는 한 반복하는 while문.
  while (cameFrom[`${current.x},${current.y}`]) {
    const currentKey = `${current.x},${current.y}`;

    // 이미 방문한 노드라면 순환 참조 경고 후 종료
    if (visited.has(currentKey)) {
      console.error(
        '무한 루프 감지: 잘못된 경로 데이터. current:',
        current,
        'cameFrom 데이터:',
        JSON.stringify(cameFrom, null, 2),
      );
      throw new Error(`순환 참조 발생: current=${JSON.stringify(current)}`);
    }

    // 현재 노드를 방문한 것으로 표시
    visited.add(currentKey);

    /**
     * 현재 노드가 cameFrom 객체에 저장된 이전 노드로 갱신하며,
     * 시작점에 도달 시, cameFrom이 빈 배열이므로 반복이 종료.
     */
    const target = cameFrom[currentKey];
    console.log('현재 경로 노드:', current, '-> 다음:', target);
    current = target;

    /**
     * 시작점부터 목표지점까지의 순서를 유지하기 위하여,
     * 이전 노드를 path 배열의 맨 앞에 추가
     * */
    path.unshift(current);
  }
  return path;
}
