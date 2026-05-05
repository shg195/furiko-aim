// canvasShot.ts — 結果画面のシェア用 PNG を生成（純関数）
//
// spec 3.5 / 6。Canvas に手書き描画（DOM レンダリングは行わない、外部依存なし）。
// 1200x630 は Twitter / OG image 比率に近い汎用サイズ。

import { ACCENT_COLOR, PERFECT_SCORE } from '../constants';
import type { GameResult } from '../types';

const W = 1200;
const H = 630;

export function makeResultPng(
  result: GameResult,
  modeLabel: string,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  // 背景
  ctx.fillStyle = '#0a0b0c';
  ctx.fillRect(0, 0, W, H);
  const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
  grd.addColorStop(0, 'rgba(255,255,255,0.03)');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // 微細なグリッド
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 上部：タイトル
  ctx.font = "700 32px 'Inter', 'Noto Sans JP', sans-serif";
  ctx.fillStyle = '#ececec';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('振', 64, 56);
  ctx.fillStyle = ACCENT_COLOR;
  ctx.fillText('り', 64 + ctx.measureText('振').width, 56);
  ctx.fillStyle = '#ececec';
  const riWidth = ctx.measureText('振り').width;
  ctx.fillText('子エイム', 64 + riWidth, 56);

  // 上部右：プロファイルラベル
  ctx.font = "500 16px 'JetBrains Mono', monospace";
  ctx.fillStyle = 'rgba(236,236,236,0.65)';
  ctx.textAlign = 'right';
  ctx.fillText(modeLabel.toUpperCase(), W - 64, 60);

  // NEW RECORD バッジ
  if (result.isNew) {
    ctx.font = "500 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = ACCENT_COLOR;
    ctx.textAlign = 'right';
    ctx.fillText('★ NEW RECORD', W - 64, 90);
  }

  // 中央：FINAL SCORE ラベル
  ctx.font = "500 14px 'JetBrains Mono', monospace";
  ctx.fillStyle = 'rgba(236,236,236,0.42)';
  ctx.textAlign = 'center';
  ctx.fillText('FINAL SCORE', W / 2, 230);

  // 中央：大型スコア
  ctx.font = "500 180px 'Inter', sans-serif";
  ctx.fillStyle = '#ececec';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(result.score.toLocaleString(), W / 2, 360);

  // % of perfect バー
  const pct = Math.min(100, (result.score / PERFECT_SCORE) * 100);
  const barX = W / 2 - 220;
  const barY = 470;
  const barW = 440;
  const barH = 6;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = ACCENT_COLOR;
  ctx.fillRect(barX, barY, (barW * pct) / 100, barH);

  // % 数値
  ctx.font = "500 28px 'JetBrains Mono', monospace";
  ctx.fillStyle = '#ececec';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `${pct.toFixed(1)}% of perfect`,
    W / 2,
    barY + barH + 18,
  );

  // 下部：PERFECT 比較ライン
  ctx.font = "500 13px 'JetBrains Mono', monospace";
  ctx.fillStyle = 'rgba(236,236,236,0.42)';
  ctx.fillText(
    `PERFECT ${PERFECT_SCORE.toLocaleString()} · 60s × 100`,
    W / 2,
    barY + barH + 60,
  );

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
