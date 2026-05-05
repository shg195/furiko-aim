// types.ts — プロジェクト全体で共有する型定義

// ─── 難易度プロファイル ─────────────────────────────────────────────────
export type BobCount = 2 | 3;
export type Tier = 'easy' | 'normal' | 'hard';
export type DifficultyKey =
  | '2-easy' | '2-normal' | '2-hard'
  | '3-easy' | '3-normal' | '3-hard';

export type DifficultyProfile = {
  bobs: BobCount;
  label: 'EASY' | 'NORMAL' | 'HARD';
  tier: Tier;
  /** 各ロッドの相対長（おもり0→おもりN-1）。配列長は bobs と一致 */
  lengths: number[];
  /** 鉛直上向き π を中心としたジッター幅（度）。各おもりの初期角度を π ± jitterDeg(rad) で独立に乱数生成 */
  jitterDeg: number;
};

// ─── モードと実行設定 ───────────────────────────────────────────────────
export type GameMode = 'normal' | 'custom';

/** カスタムモードのユーザー入力。bobs 以外の配列は最大3要素分保持し、slice して使う */
export type CustomConfig = {
  bobs: BobCount;
  /** 長さ。配列長は3。bobs=2 のときは先頭2要素のみ参照 */
  lengths: [number, number, number];
  /** 初期角度（rad、π=鉛直上向き）。配列長は3。bobs=2 のときは先頭2要素のみ参照 */
  angles: [number, number, number];
};

/** 1ゲーム実行時に使う設定（ノーマル/カスタムを統一して扱う） */
export type RunConfig = {
  /** 各ロッドの相対長 */
  lengths: number[];
  /** 各おもりの初期角度（rad） */
  angles: number[];
  /** HUD の MODE 表示用ラベル */
  label: string;
  /** ハイスコア対象なら true */
  scorable: boolean;
  /** localStorage キー（記録対象時のみ）。例：`'2-easy'`, `'custom-2'` */
  profileKey: HighScoreKey | null;
};

// ─── ハイスコア ─────────────────────────────────────────────────────────
export type CustomKey = 'custom-2' | 'custom-3';
export type HighScoreKey = DifficultyKey | CustomKey;
export type HighScores = Partial<Record<HighScoreKey, number>>;

// ─── 画面 / フェーズ ────────────────────────────────────────────────────
export type ScreenName =
  | 'title' | 'mode' | 'difficulty' | 'custom' | 'game' | 'result';

export type GamePhase = 'countdown' | 'playing' | 'paused' | 'ending';

// ─── 結果 ──────────────────────────────────────────────────────────────
export type GameResult = {
  /** 整数化済みの最終スコア */
  score: number;
  /** 新記録判定（スコア対象時のみ true になる可能性あり） */
  isNew: boolean;
  mode: GameMode;
  profileKey: HighScoreKey | null;
};

// ─── 物理シミュレーション ──────────────────────────────────────────────
/** 振り子の状態：[θ1, ω1, θ2, ω2, ...] の平坦配列 */
export type PendulumState = number[];

/** 物理パラメータ（n 振り子に対応） */
export type PendulumParams = {
  lengths: number[];
  masses: number[];
};

/** 2D ベクトル（描画座標 px or 物理座標、文脈で区別） */
export type Vec2 = { x: number; y: number };

/** 軌跡サンプル（描画座標 px と時刻 ms） */
export type TrailSample = Vec2 & { t: number };

// ─── スコアリング ──────────────────────────────────────────────────────
/** 1フレーム分のスコア（0..1） */
export type ScorePerFrame = number;

/** スコア計算入力 */
export type ScoreInput = {
  cursorPx: Vec2;
  tipPx: Vec2;
  trail: TrailSample[];
  /** 振り子全長を画面 px に換算した値 */
  totalLenPx: number;
  /** カーソルがフィールド円内なら true */
  inField: boolean;
  /** 軌跡なぞりスコアを有効化するか */
  trailScoringEnabled: boolean;
};

// ─── Tweaks（本番では UI 非表示。既定値固定） ───────────────────────────
export type TrailStyle = 'glow' | 'particles' | 'dual';
export type FeedbackStyle = 'ring' | 'line' | 'pulse' | 'all' | 'none';

export type TweakSettings = {
  accent: string;
  trailStyle: TrailStyle;
  feedbackStyle: FeedbackStyle;
  monoNumerics: boolean;
  trailScoring: boolean;
};
