// chaos.ts — spec 2.6 カオス保証（ノーマルモードのみ）
//
// プロファイルから初期角度を一様乱数生成 → 数秒分シミュレーション → 先端の総移動量を測定。
// 閾値未満なら再生成。最大試行回数を超えたら最後の生成結果を採用。

import {
  CHAOS_MAX_RETRIES,
  CHAOS_MIN_TIP_DISPLACEMENT,
  CHAOS_VERIFY_SECONDS,
  RK4_SUBSTEPS,
} from '../constants';
import type { DifficultyProfile, PendulumState } from '../types';
import { bobPositions, stepPendulum } from './physics';

type TrialResult = {
  angles: number[];
  displacement: number;
};

function trial(
  profile: DifficultyProfile,
  rand: () => number,
): TrialResult {
  const jitter = (profile.jitterDeg * Math.PI) / 180;
  const angles = profile.lengths.map(
    () => Math.PI + (rand() - 0.5) * 2 * jitter,
  );
  const masses = profile.lengths.map(() => 1);

  const n = profile.lengths.length;
  let s: PendulumState = new Array(n * 2).fill(0);
  for (let i = 0; i < n; i++) {
    s[2 * i] = angles[i];
    s[2 * i + 1] = 0;
  }

  const dt = 1 / 60;
  const totalSteps = Math.floor(CHAOS_VERIFY_SECONDS / dt);

  let prevTip = bobPositions(s, profile.lengths)[n];
  let displacement = 0;

  for (let i = 0; i < totalSteps; i++) {
    s = stepPendulum(s, dt, profile.lengths, masses, RK4_SUBSTEPS);
    const tip = bobPositions(s, profile.lengths)[n];
    displacement += Math.hypot(tip.x - prevTip.x, tip.y - prevTip.y);
    prevTip = tip;
  }

  return { angles, displacement };
}

/**
 * 数秒シミュレーションして先端の総移動量が `CHAOS_MIN_TIP_DISPLACEMENT` 以上になる
 * 初期角度を返す。最大 `CHAOS_MAX_RETRIES` 回まで再試行し、超えたら最後の生成結果を採用。
 *
 * 物理単位での移動量（おもりの位置座標は profile.lengths と同じスケール）。
 *
 * @param profile 難易度プロファイル
 * @param rand    乱数源（テスト用に差し替え可）。既定は Math.random
 */
export function generateChaoticAngles(
  profile: DifficultyProfile,
  rand: () => number = Math.random,
): number[] {
  let last = trial(profile, rand);
  if (last.displacement >= CHAOS_MIN_TIP_DISPLACEMENT) return last.angles;

  for (let i = 0; i < CHAOS_MAX_RETRIES; i++) {
    last = trial(profile, rand);
    if (last.displacement >= CHAOS_MIN_TIP_DISPLACEMENT) return last.angles;
  }
  return last.angles;
}
