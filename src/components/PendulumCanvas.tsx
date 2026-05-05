// PendulumCanvas.tsx — 振り子・ロッド・軌跡・フィールド円・先端ハイライトの描画コア
//
// 物理積分は src/lib/physics.ts。本コンポーネントは描画のみを担い、
// カーソル追跡・スコア計算・フィードバックリング等は M3 で別途追加する。

import { useEffect, useRef } from 'react';
import {
  ACCENT_COLOR,
  FIELD_RADIUS_RATIO,
  RK4_SUBSTEPS,
  TRAIL_LIFETIME_MS,
} from '../constants';
import { bobPositions, stepPendulum } from '../lib/physics';
import type { PendulumState, TrailSample, Vec2 } from '../types';

type Props = {
  /** 各ロッドの相対長（おもり数 = 配列長） */
  lengths: number[];
  /**
   * 各おもりの初期角度（rad、π=鉛直上向き）。
   * 未指定の場合は π ± 0.6 のジッターでランダム生成
   */
  initialAngles?: number[];
  /** true で物理積分を停止し、軌跡のエージングも止める */
  paused?: boolean;
  /**
   * タイトル背景等の軽量モード。glow を弱め、軌跡の不透明度を下げる。
   * このコンポーネントではカーソル関連の処理はしないので主に発色を抑える用途
   */
  ambient?: boolean;
  className?: string;
  /** glow とリングの色。既定はアクセント色 #d21e1e */
  accent?: string;
  /** 先端おもりの CSS px 座標を毎フレーム通知（AIM HERE マーカー等で使用） */
  onTipPosition?: (pos: Vec2) => void;
};

export default function PendulumCanvas({
  lengths,
  initialAngles,
  paused = false,
  ambient = false,
  className = '',
  accent = ACCENT_COLOR,
  onTipPosition,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    s: PendulumState;
    lengths: number[];
    masses: number[];
  } | null>(null);
  const trailRef = useRef<TrailSample[]>([]);
  const rafRef = useRef(0);

  // おもり数が変わったときに状態を初期化
  useEffect(() => {
    const n = lengths.length;
    const masses = lengths.map(() => 1);
    const angles =
      initialAngles ??
      lengths.map(() => Math.PI + (Math.random() - 0.5) * 1.2);
    const s: PendulumState = new Array(n * 2).fill(0);
    for (let i = 0; i < n; i++) {
      s[2 * i] = angles[i];
      s[2 * i + 1] = 0;
    }
    stateRef.current = { s, lengths: [...lengths], masses };
    trailRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lengths.length]);

  // ロッド長 / 初期角度のシームレス更新（パラメータ調整中の点滅を避ける）
  useEffect(() => {
    const st = stateRef.current;
    if (!st || st.lengths.length !== lengths.length) return;
    st.lengths = [...lengths];
    if (initialAngles && paused) {
      for (let i = 0; i < initialAngles.length; i++) {
        st.s[2 * i] = initialAngles[i];
        st.s[2 * i + 1] = 0;
      }
      trailRef.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lengths), JSON.stringify(initialAngles), paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastT = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      let dt = Math.min((now - lastT) / 1000, 1 / 30);
      lastT = now;

      const st = stateRef.current;
      if (!st) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      if (paused) {
        dt = 0;
      } else {
        st.s = stepPendulum(st.s, dt, st.lengths, st.masses, RK4_SUBSTEPS);
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const totalLen = st.lengths.reduce((a, b) => a + b, 0);
      const fieldRadius = Math.min(w, h) * FIELD_RADIUS_RATIO;
      const scale = fieldRadius / totalLen;

      const bobs = bobPositions(st.s, st.lengths).map((p) => ({
        x: cx + p.x * scale,
        y: cy + p.y * scale,
      }));
      const tip = bobs[bobs.length - 1];

      // 軌跡の更新：再生中は先端を push、一時停止中はタイムスタンプを凍結
      if (paused) {
        const trailArr = trailRef.current;
        for (let i = 0; i < trailArr.length; i++) {
          trailArr[i].t = now - i * 16;
        }
      } else {
        trailRef.current.push({ x: tip.x, y: tip.y, t: now });
      }
      const cutoff = now - TRAIL_LIFETIME_MS;
      while (
        trailRef.current.length > 0 &&
        trailRef.current[0].t < cutoff
      ) {
        trailRef.current.shift();
      }
      const trail = trailRef.current;

      if (onTipPosition) onTipPosition({ x: tip.x / dpr, y: tip.y / dpr });

      // ─── Draw ────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);

      // フィールド円
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([4 * dpr, 6 * dpr]);
      ctx.beginPath();
      ctx.arc(cx, cy, fieldRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 固定点
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // 軌跡（glow ハードコード。spec 2.13 で Tweaks UI 非表示・既定固定）
      if (trail.length > 1) {
        ctx.save();
        ctx.shadowColor = accent;
        ctx.shadowBlur = (ambient ? 6 : 14) * dpr;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5 * dpr;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < trail.length; i++) {
          const a = (trail[i].t - cutoff) / TRAIL_LIFETIME_MS;
          ctx.globalAlpha =
            Math.max(0, Math.min(1, a)) * (ambient ? 0.45 : 0.85);
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ロッド
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.2 * dpr;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bobs[0].x, bobs[0].y);
      for (let i = 1; i < bobs.length; i++) {
        ctx.lineTo(bobs[i].x, bobs[i].y);
      }
      ctx.stroke();
      ctx.restore();

      // 中間おもり
      for (let i = 1; i < bobs.length - 1; i++) {
        ctx.fillStyle = '#e8e8e6';
        ctx.beginPath();
        ctx.arc(bobs[i].x, bobs[i].y, 5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 先端おもり（accent ring + glow）
      const tipR = 8 * dpr;
      ctx.save();
      ctx.shadowColor = accent;
      // glow 強度はスコア（M3 で導入）でモジュレートする想定。M2 では固定弱め
      ctx.shadowBlur = 10 * dpr * 0.4;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, tipR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2 * dpr;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, tipR + 3 * dpr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [accent, ambient, paused, onTipPosition]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
