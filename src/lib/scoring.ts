// scoring.ts — spec 2.2 の距離スコア（純関数）
//
// score_per_frame = max(tipScore, trailScore)
//   tipScore   = exp(-d² / σ²) で 3σ 裾切り、σ = totalLenPx × SIGMA_FACTOR_TIP
//   trailScore = exp(-minD² / σ_t²) × TRAIL_SCORE_WEIGHT、σ_t = σ × SIGMA_FACTOR_TRAIL_MULT
// カーソルがフィールド外なら 0。

import {
  SCORE_CUTOFF_SIGMA,
  SIGMA_FACTOR_TIP,
  SIGMA_FACTOR_TRAIL_MULT,
  TRAIL_SCORE_WEIGHT,
} from '../constants';
import type {
  ScoreInput,
  ScorePerFrame,
  TrailSample,
  Vec2,
} from '../types';

function pointToSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 1e-6) {
    t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
  }
  const qx = a.x + t * dx;
  const qy = a.y + t * dy;
  return Math.hypot(p.x - qx, p.y - qy);
}

function minDistanceToTrail(cursor: Vec2, trail: TrailSample[]): number {
  if (trail.length < 2) return Infinity;
  let minD = Infinity;
  for (let i = 1; i < trail.length; i++) {
    const d = pointToSegmentDistance(cursor, trail[i - 1], trail[i]);
    if (d < minD) minD = d;
  }
  return minD;
}

export function computeScore(input: ScoreInput): ScorePerFrame {
  if (!input.inField) return 0;

  const sigma = input.totalLenPx * SIGMA_FACTOR_TIP;
  const sigmaCutoff = sigma * SCORE_CUTOFF_SIGMA;

  let tipScore = 0;
  const dTip = Math.hypot(
    input.cursorPx.x - input.tipPx.x,
    input.cursorPx.y - input.tipPx.y,
  );
  if (dTip < sigmaCutoff) {
    tipScore = Math.exp(-(dTip * dTip) / (sigma * sigma));
  }

  let trailScore = 0;
  if (input.trailScoringEnabled && input.trail.length > 1) {
    const sigmaTrail = sigma * SIGMA_FACTOR_TRAIL_MULT;
    const sigmaTrailCutoff = sigmaTrail * SCORE_CUTOFF_SIGMA;
    const minD = minDistanceToTrail(input.cursorPx, input.trail);
    if (minD < sigmaTrailCutoff) {
      trailScore =
        Math.exp(-(minD * minD) / (sigmaTrail * sigmaTrail)) *
        TRAIL_SCORE_WEIGHT;
    }
  }

  return Math.max(tipScore, trailScore);
}
