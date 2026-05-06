// constants.ts — プロジェクト全体で共有する定数

import type { DifficultyKey, DifficultyProfile, TweakSettings } from './types';

// ─── ゲーム時間 / スコア ───────────────────────────────────────────────
export const TOTAL_SECONDS = 60;
/** 1秒あたりに加算しうるスコアのスケール係数（score_per_frame × dt × SCORE_SCALE で累積） */
export const SCORE_SCALE = 100;
/** 理論最大スコア（60秒 × 100） */
export const PERFECT_SCORE = TOTAL_SECONDS * SCORE_SCALE;

// ─── スコアリング ──────────────────────────────────────────────────────
/** σ = 振り子全長 × SIGMA_FACTOR_TIP（先端追跡） */
export const SIGMA_FACTOR_TIP = 0.06;
/** σ_t = σ × SIGMA_FACTOR_TRAIL_MULT（軌跡なぞり） */
export const SIGMA_FACTOR_TRAIL_MULT = 1.5;
/** 軌跡なぞりスコアの重み（先端より弱く） */
export const TRAIL_SCORE_WEIGHT = 0.55;
/** 3σ で裾切り */
export const SCORE_CUTOFF_SIGMA = 3;

// ─── 軌跡 ──────────────────────────────────────────────────────────────
/** 軌跡保持時間（ms） */
export const TRAIL_LIFETIME_MS = 500;

// ─── フィールド ────────────────────────────────────────────────────────
/** フィールド半径 = min(canvas.width, canvas.height) × FIELD_RADIUS_RATIO */
export const FIELD_RADIUS_RATIO = 0.42;

// ─── 物理シミュレーション ──────────────────────────────────────────────
/** 重力加速度 */
export const GRAVITY = 9.81;
/** 1描画フレームあたりの RK4 サブステップ数 */
export const RK4_SUBSTEPS = 8;

// ─── カウントダウン ─────────────────────────────────────────────────────
/** 開始前カウントダウン秒数（resume 時も同じ） */
export const COUNTDOWN_SECONDS = 3;

// ─── アクセント色（Tweaks UI 非表示で固定） ────────────────────────────
export const ACCENT_COLOR = '#d21e1e';

// ─── 本番固定 Tweaks ───────────────────────────────────────────────────
export const FIXED_TWEAKS: TweakSettings = {
  accent: ACCENT_COLOR,
  trailStyle: 'glow',
  feedbackStyle: 'ring',
  monoNumerics: true,
  trailScoring: true,
};

// ─── localStorage キー ─────────────────────────────────────────────────
export const HS_STORAGE_KEY = 'furiko-aim-highscores-v2';

// ─── 難易度プロファイル ─────────────────────────────────────────────────
export const PROFILES: Record<DifficultyKey, DifficultyProfile> = {
  '2-easy':   { bobs: 2, label: 'EASY',   tier: 'easy',   lengths: [1.0, 0.8],      jitterDeg: 90 },
  '2-normal': { bobs: 2, label: 'NORMAL', tier: 'normal', lengths: [1.0, 0.6],      jitterDeg: 60 },
  '2-hard':   { bobs: 2, label: 'HARD',   tier: 'hard',   lengths: [1.0, 0.4],      jitterDeg: 45 },
  '3-easy':   { bobs: 3, label: 'EASY',   tier: 'easy',   lengths: [1.0, 0.8, 0.6], jitterDeg: 75 },
  '3-normal': { bobs: 3, label: 'NORMAL', tier: 'normal', lengths: [1.0, 0.7, 0.5], jitterDeg: 50 },
  '3-hard':   { bobs: 3, label: 'HARD',   tier: 'hard',   lengths: [1.0, 0.5, 0.3], jitterDeg: 35 },
};

// ─── カオス保証パラメータ（チューニング段階で調整） ─────────────────
export const CHAOS_VERIFY_SECONDS = 3;
/** 先端の総移動量（物理単位）の最低閾値。実装段階で計測して調整 */
export const CHAOS_MIN_TIP_DISPLACEMENT = 4.0;
/** 再生成の最大試行回数。超えたら最後の生成結果を採用 */
export const CHAOS_MAX_RETRIES = 20;
