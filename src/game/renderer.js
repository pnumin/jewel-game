import { HUES } from './constants';

function poly(n, rot) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n;
    p.push([Math.cos(a), Math.sin(a)]);
  }
  return p;
}

const SHAPES = [
  poly(4, -Math.PI / 2),                                                    // 빨강 마름모
  [[0, -1], [0.95, 0.62], [-0.95, 0.62]],                                   // 초록 삼각형
  [[-0.5, -0.65], [0.5, -0.65], [0.95, -0.15], [0, 0.95], [-0.95, -0.15]],  // 파랑 다이아몬드
  poly(8, Math.PI / 8),                                                     // 분홍 팔각형
  poly(6, 0),                                                               // 노랑 육각형
  poly(10, 0),                                                              // 보라 원형
];
const LIGHT = [-0.55, -0.83];

function path(ctx, pts, r) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)));
  ctx.closePath();
}

/** 보석 하나를 (cx, cy) 중심, 반지름 r 로 그린다. */
export function drawGem(ctx, t, cx, cy, r, alpha = 1) {
  const pts = SHAPES[t], h = HUES[t], k = 0.55;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = alpha;

  path(ctx, pts, r);
  ctx.fillStyle = `hsl(${h},70%,22%)`;
  ctx.fill();

  // 경사면(facet): 빛 방향에 따라 밝기를 달리한다
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]);
    const len = Math.hypot(nx, ny); nx /= len; ny /= len;
    const lit = nx * LIGHT[0] + ny * LIGHT[1];
    ctx.beginPath();
    ctx.moveTo(a[0] * r, a[1] * r);
    ctx.lineTo(b[0] * r, b[1] * r);
    ctx.lineTo(b[0] * r * k, b[1] * r * k);
    ctx.lineTo(a[0] * r * k, a[1] * r * k);
    ctx.closePath();
    ctx.fillStyle = `hsl(${h},78%,${46 + lit * 22}%)`;
    ctx.fill();
  }

  // 윗면
  path(ctx, pts, r * k);
  const g = ctx.createLinearGradient(-r * k, -r * k, r * k, r * k);
  g.addColorStop(0, `hsl(${h},85%,74%)`);
  g.addColorStop(1, `hsl(${h},78%,50%)`);
  ctx.fillStyle = g;
  ctx.fill();

  // 테두리 + 하이라이트
  path(ctx, pts, r);
  ctx.lineWidth = 2;
  ctx.strokeStyle = `hsl(${h},60%,18%)`;
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-r * 0.22, -r * 0.28, r * 0.16, r * 0.08, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 0.6);
    ctx.fillStyle = `hsl(${p.h},90%,70%)`;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}

export function drawPopups(ctx, popups) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Malgun Gothic", sans-serif';
  for (const p of popups) {
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = '#ffe680';
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}
