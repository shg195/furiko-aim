// PauseOverlay.tsx — 一時停止オーバーレイ
// 4 ボタン：RESUME / RETRY / DIFFICULTY / HOME（spec 2.12）
// MODE 表示は kicker の下に格納（HUD top には載せない）

type Props = {
  modeLabel: string;
  /** 「DIFFICULTY」相当ボタンの文言。ノーマル時は 'DIFFICULTY'、カスタム時は 'CUSTOM' */
  difficultyLabel?: string;
  remain: number;
  score: number;
  onResume: () => void;
  onRetry: () => void;
  onDifficulty: () => void;
  onHome: () => void;
};

export default function PauseOverlay({
  modeLabel,
  difficultyLabel = 'DIFFICULTY',
  remain,
  score,
  onResume,
  onRetry,
  onDifficulty,
  onHome,
}: Props) {
  return (
    <div className="pause-overlay">
      <div className="pause-card">
        <div className="kicker mono">PAUSED</div>
        <div className="pause-mode mono">{modeLabel}</div>
        <div className="pause-stats">
          <div>
            <div className="muted mono xs">TIME LEFT</div>
            <div className="mono lg">{remain.toFixed(1)}s</div>
          </div>
          <div>
            <div className="muted mono xs">SCORE</div>
            <div className="mono lg accent-text">
              {Math.round(score).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="pause-actions">
          <button className="btn btn-primary" onClick={onResume}>
            <span>RESUME</span>
            <span className="btn-arrow">→</span>
          </button>
          <button className="btn btn-ghost" onClick={onRetry}>
            RETRY
          </button>
          <button className="btn btn-ghost" onClick={onDifficulty}>
            {difficultyLabel}
          </button>
          <button className="btn btn-ghost" onClick={onHome}>
            HOME
          </button>
        </div>
        <div className="muted mono xs">[ESC] / [SPACE] to resume</div>
      </div>
    </div>
  );
}
