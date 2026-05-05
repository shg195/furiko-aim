// HUD.tsx — ハンドオフ準拠の HUD（spec 3.4 / M5）
// 左ブロック：PAUSE ピル
// 中央：TIME（残秒）+ time-bar
// 右ブロック：SCORE + PRECISION
// MODE 表示は本 HUD では持たない（一時停止オーバーレイに格納）

import type { GamePhase } from '../types';
import PrecisionMeter from './PrecisionMeter';
import TimeBar from './TimeBar';

type Props = {
  remain: number;
  total: number;
  score: number;
  /** 直近フレームの 0..1 スコア（PRECISION メーター用） */
  live: number;
  phase: GamePhase;
  onPause: () => void;
};

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4l14 8-14 8z" />
    </svg>
  );
}

export default function HUD({
  remain,
  total,
  score,
  live,
  phase,
  onPause,
}: Props) {
  const isPaused = phase === 'paused';
  const isCountdown = phase === 'countdown';
  return (
    <div className="hud hud-top">
      <div className="hud-block left">
        <button
          className="ctrl-pill"
          onClick={onPause}
          disabled={isCountdown || phase === 'ending'}
          aria-label={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <PlayIcon /> : <PauseIcon />}
          <span className="mono small">{isPaused ? 'RESUME' : 'PAUSE'}</span>
          <span className="kbd mono xs">ESC</span>
        </button>
      </div>

      <div className="hud-center">
        <div className="hud-time mono">
          {remain.toFixed(1)}
          <span className="hud-unit">s</span>
        </div>
        <TimeBar pct={remain / total} />
      </div>

      <div className="hud-block right">
        <div className="hud-label mono">SCORE</div>
        <div className="hud-score mono">
          {Math.round(score).toLocaleString()}
        </div>
        <div className="hud-precision">
          <PrecisionMeter value={live} />
          <span className="mono xs">{(live * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
