import { N, TYPES } from './constants';

export const rnd = (n) => Math.floor(Math.random() * n);

/** 보석 하나. x, y 는 화면에 그려지는 위치(칸 단위)이며 실제 칸으로 애니메이션된다. */
export const makeGem = (t, x, y) => ({ t, x, y, v: 0, s: 1, dying: false });

/** 매칭·사각형이 없고 가능한 이동이 있는 새 보드. 보석은 위에서 떨어지며 등장한다. */
export function newBoard() {
  let grid;
  do {
    grid = [];
    for (let r = 0; r < N; r++) {
      grid.push([]);
      for (let c = 0; c < N; c++) {
        let t;
        do { t = rnd(TYPES); } while (
          (c >= 2 && grid[r][c - 1].t === t && grid[r][c - 2].t === t) ||
          (r >= 2 && grid[r - 1][c].t === t && grid[r - 2][c].t === t) ||
          (r >= 1 && c >= 1 && grid[r - 1][c].t === t && grid[r][c - 1].t === t && grid[r - 1][c - 1].t === t));
        grid[r].push(makeGem(t, c, r - N - 1));
      }
    }
  } while (!findMove(grid));
  return grid;
}

/** 제거할 칸 목록과 2x2 사각형 개수. cells 는 "r,c" 문자열 Set. */
export function findMatches(grid) {
  const cells = new Set();
  let squares = 0;
  const at = (r, c) => grid[r]?.[c]?.t;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const t = at(r, c);
      if (t === undefined) continue;
      if (c <= N - 3 && at(r, c + 1) === t && at(r, c + 2) === t) {
        let e = c; while (e < N && at(r, e) === t) cells.add(`${r},${e++}`);
      }
      if (r <= N - 3 && at(r + 1, c) === t && at(r + 2, c) === t) {
        let e = r; while (e < N && at(e, c) === t) cells.add(`${e++},${c}`);
      }
      if (r <= N - 2 && c <= N - 2 && at(r, c + 1) === t && at(r + 1, c) === t && at(r + 1, c + 1) === t) {
        squares++;
        cells.add(`${r},${c}`); cells.add(`${r},${c + 1}`);
        cells.add(`${r + 1},${c}`); cells.add(`${r + 1},${c + 1}`);
      }
    }
  }
  return { cells, squares };
}

export function swapCells(grid, a, b) {
  const tmp = grid[a.r][a.c];
  grid[a.r][a.c] = grid[b.r][b.c];
  grid[b.r][b.c] = tmp;
}

/** 매칭을 만드는 교환 하나를 찾는다. 없으면 null. */
export function findMove(grid) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const a = { r, c }, b = { r: r + dr, c: c + dc };
        if (b.r >= N || b.c >= N) continue;
        swapCells(grid, a, b);
        const ok = findMatches(grid).cells.size > 0;
        swapCells(grid, a, b);
        if (ok) return [a, b];
      }
    }
  }
  return null;
}

/** 제거된 칸(null)을 채운다: 위 보석을 내리고 새 보석은 보드 위에서 떨어지게 한다. */
export function applyGravity(grid) {
  for (let c = 0; c < N; c++) {
    let w = N - 1;
    for (let r = N - 1; r >= 0; r--) {
      if (grid[r][c]) {
        if (r !== w) { grid[w][c] = grid[r][c]; grid[r][c] = null; }
        w--;
      }
    }
    const cnt = w + 1;
    for (let r = w; r >= 0; r--) grid[r][c] = makeGem(rnd(TYPES), c, r - cnt - 0.3);
  }
}

/** 매칭이 없고 이동이 가능해질 때까지 보석 위치를 섞는다. */
export function shuffleBoard(grid) {
  const all = grid.flat();
  do {
    for (let i = all.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }
    for (let i = 0; i < all.length; i++) grid[Math.floor(i / N)][i % N] = all[i];
  } while (findMatches(grid).cells.size || !findMove(grid));
}
