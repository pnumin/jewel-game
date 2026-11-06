import { N, CELL as S, MAX_MOVES, HUES } from './constants';
import { newBoard, findMatches, swapCells, findMove, applyGravity, shuffleBoard } from './board';
import { matchPoints } from './scoring';
import { drawGem, drawParticles, drawPopups } from './renderer';

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

/**
 * Canvas 하나에 붙어 보드 상태·애니메이션·입력을 관리한다.
 * 화면에 표시할 값(점수, 남은 이동, 진행 중 여부, 게임 종료)은 onState 콜백으로 알린다.
 */
export class GameEngine {
  constructor(canvas, onState) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.onState = onState;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = N * S * dpr;
    canvas.height = N * S * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.locked = false;
    this.alive = true;
    this.particles = [];
    this.popups = [];
    this.settleQ = [];
    this.down = null;
    this.last = 0;

    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.frame = this.frame.bind(this);
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);

    this.raf = requestAnimationFrame(this.frame);
    this.newGame();
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this.cv.removeEventListener('pointerdown', this.onDown);
    this.cv.removeEventListener('pointermove', this.onMove);
    this.cv.removeEventListener('pointerup', this.onUp);
    this.cv.removeEventListener('pointercancel', this.onUp);
    this.settleQ.forEach((f) => f());
    this.settleQ = [];
  }

  emit() {
    if (!this.alive) return;
    this.onState({
      score: this.score,
      moves: this.moves,
      busy: this.busy,
      gameOver: this.moves <= 0 && !this.busy,
    });
  }

  /** 모달이 열려 있는 동안 등 입력을 막는다 (RNK-6). */
  setLocked(locked) {
    this.locked = locked;
    if (locked) { this.sel = null; this.down = null; }
  }

  async newGame() {
    this.grid = newBoard();
    this.score = 0;
    this.moves = MAX_MOVES;
    this.combo = 0;
    this.sel = null;
    this.hint = null;
    this.busy = true;
    this.emit();
    await this.settle();
    this.busy = false;
    this.emit();
  }

  showHint() {
    if (this.busy || this.locked || this.moves <= 0) return;
    this.hint = findMove(this.grid);
    this.hintTime = 0;
  }

  settle() {
    return new Promise((res) => this.settleQ.push(res));
  }

  async trySwap(a, b) {
    this.busy = true;
    this.sel = null;
    this.hint = null;
    this.emit();
    swapCells(this.grid, a, b);
    await this.settle();
    if (findMatches(this.grid).cells.size === 0) {
      swapCells(this.grid, a, b);     // CTL-3: 맞는 줄이 없으면 되돌리기
      await this.settle();
      this.busy = false;
      this.emit();
      return;
    }
    this.moves--;
    this.combo = 0;
    this.emit();
    await this.resolveBoard();
    this.busy = false;
    this.emit();
  }

  async resolveBoard() {
    while (this.alive) {
      const { cells, squares } = findMatches(this.grid);
      if (!cells.size) break;
      this.combo++;
      const pts = matchPoints(cells.size, squares, this.combo);
      this.score += pts;
      this.emit();

      let sx = 0, sy = 0;
      for (const k of cells) {
        const [r, c] = k.split(',').map(Number);
        const g = this.grid[r][c];
        g.dying = true;
        sx += c; sy += r;
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160;
          this.particles.push({ x: c * S + S / 2, y: r * S + S / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6, h: HUES[g.t] });
        }
      }
      this.popups.push({
        x: (sx / cells.size) * S + S / 2,
        y: (sy / cells.size) * S + S / 2,
        text: (squares ? '사각형! ' : '') + '+' + pts + (this.combo > 1 ? `  x${this.combo} 콤보!` : ''),
        life: 1,
      });

      await wait(230);
      for (const k of cells) {
        const [r, c] = k.split(',').map(Number);
        this.grid[r][c] = null;
      }
      applyGravity(this.grid);
      await this.settle();
    }
    if (this.alive && !findMove(this.grid)) {
      this.popups.push({ x: (N * S) / 2, y: (N * S) / 2, text: '움직일 곳이 없어요! 섞는 중...', life: 1.5 });
      shuffleBoard(this.grid);
      await this.settle();
    }
  }

  // ---------- 입력 ----------
  cellAt(e) {
    const rc = this.cv.getBoundingClientRect();
    const fx = ((e.clientX - rc.left) / rc.width) * N;
    const fy = ((e.clientY - rc.top) / rc.height) * N;
    return { r: Math.floor(fy), c: Math.floor(fx), fx, fy };
  }

  canInput() {
    return !this.busy && !this.locked && this.moves > 0;
  }

  onDown(e) {
    if (!this.canInput()) return;
    const p = this.cellAt(e);
    if (p.r < 0 || p.r >= N || p.c < 0 || p.c >= N) return;
    this.down = p;
    this.cv.setPointerCapture?.(e.pointerId);
  }

  onMove(e) {
    if (!this.down || !this.canInput()) return;
    const p = this.cellAt(e);
    const dx = p.fx - this.down.fx, dy = p.fy - this.down.fy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 0.45) return;
    const b = Math.abs(dx) > Math.abs(dy)
      ? { r: this.down.r, c: this.down.c + Math.sign(dx) }
      : { r: this.down.r + Math.sign(dy), c: this.down.c };
    const a = { r: this.down.r, c: this.down.c };
    this.down = null;
    if (b.r >= 0 && b.r < N && b.c >= 0 && b.c < N) this.trySwap(a, b);
  }

  onUp() {
    if (!this.down || !this.canInput()) { this.down = null; return; }
    const p = { r: this.down.r, c: this.down.c };
    this.down = null;
    if (this.sel && adjacent(this.sel, p)) this.trySwap(this.sel, p);
    else this.sel = this.sel && this.sel.r === p.r && this.sel.c === p.c ? null : p;
  }

  // ---------- 그리기 루프 ----------
  frame(ts) {
    if (!this.alive) return;
    const dt = Math.min(0.05, (ts - this.last) / 1000 || 0);
    this.last = ts;
    const ctx = this.ctx;
    let moving = false;

    ctx.clearRect(0, 0, N * S, N * S);
    ctx.fillStyle = '#0d0b18';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if ((r + c) % 2) ctx.fillRect(c * S, r * S, S, S);
    }
    if (this.sel) {
      ctx.fillStyle = '#ffffff22';
      ctx.fillRect(this.sel.c * S, this.sel.r * S, S, S);
      ctx.strokeStyle = '#ffcf4a';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.sel.c * S + 2, this.sel.r * S + 2, S - 4, S - 4);
    }
    if (this.hint) {
      this.hintTime += dt;
      if (this.hintTime > 2.5) this.hint = null;
      else {
        ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(this.hintTime * 10)})`;
        ctx.lineWidth = 3;
        for (const h of this.hint) ctx.strokeRect(h.c * S + 4, h.r * S + 4, S - 8, S - 8);
      }
    }

    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const g = this.grid?.[r][c];
      if (!g) continue;
      const dx = c - g.x, dy = r - g.y;
      if (dx || dy) {
        moving = true;
        g.v = Math.min(g.v + 40 * dt, 18);
        const d = Math.hypot(dx, dy), step = (7 + g.v) * dt;
        if (d <= step) { g.x = c; g.y = r; g.v = 0; }
        else { g.x += (dx / d) * step; g.y += (dy / d) * step; }
      }
      if (g.dying) g.s = Math.max(0, g.s - dt * 4.5);
      const selected = this.sel && this.sel.r === r && this.sel.c === c;
      const pulse = selected ? 1 + Math.sin(ts / 120) * 0.06 : 1;
      drawGem(ctx, g.t, g.x * S + S / 2, g.y * S + S / 2, S * 0.4 * g.s * pulse, g.dying ? g.s : 1);
    }

    this.particles = this.particles.filter((p) => (p.life -= dt) > 0);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }
    drawParticles(ctx, this.particles);

    this.popups = this.popups.filter((p) => (p.life -= dt * 0.9) > 0);
    for (const p of this.popups) p.y -= 30 * dt;
    drawPopups(ctx, this.popups);

    if (!moving && this.settleQ.length) {
      const q = this.settleQ;
      this.settleQ = [];
      q.forEach((f) => f());
    }
    this.raf = requestAnimationFrame(this.frame);
  }
}
