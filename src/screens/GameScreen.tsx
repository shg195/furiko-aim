// GameScreen.tsx — ゲーム画面のラッパー（M5 + M4 を結線）
// useGameLoop で時間・スコア・一時停止を管理し、PendulumCanvas / HUD / CountdownOverlay / PauseOverlay を結線。

import { useState } from 'react';
import CountdownOverlay from '../components/CountdownOverlay';
import HUD from '../components/HUD';
import PauseOverlay from '../components/PauseOverlay';
import PendulumCanvas from '../components/PendulumCanvas';
import { TOTAL_SECONDS } from '../constants';
import { useGameLoop } from '../hooks/useGameLoop';
import type { RunConfig, Vec2 } from '../types';

type Props = {
  config: RunConfig;
  modeLabel: string;
  onFinish: (finalScore: number) => void;
  onRetry: () => void;
  onDifficulty: () => void;
  onHome: () => void;
};

export default function GameScreen({
  config,
  modeLabel,
  onFinish,
  onRetry,
  onDifficulty,
  onHome,
}: Props) {
  const [tipPos, setTipPos] = useState<Vec2>({ x: 0, y: 0 });
  const loop = useGameLoop({
    scorable: config.scorable,
    onFinish,
  });
  const isResume = loop.remain < TOTAL_SECONDS;
  const isCustom = config.profileKey?.startsWith('custom') ?? false;
  const difficultyLabel = isCustom ? 'CUSTOM' : 'DIFFICULTY';

  return (
    <div className="screen game-screen">
      <div className="game-canvas-wrap">
        <PendulumCanvas
          lengths={config.lengths}
          initialAngles={config.angles}
          showCursor={loop.phase === 'playing'}
          trailScoring
          paused={loop.isPaused}
          feedbackStyle={loop.phase === 'playing' ? 'ring' : 'none'}
          onScoreChange={loop.handleScoreChange}
          onTipPosition={setTipPos}
        />
      </div>

      <HUD
        remain={loop.remain}
        total={TOTAL_SECONDS}
        score={loop.score}
        live={loop.live}
        phase={loop.phase}
        onPause={loop.togglePause}
      />

      {loop.phase === 'countdown' && (
        <CountdownOverlay
          count={loop.count}
          modeLabel={modeLabel}
          isResume={isResume}
          tipPos={tipPos}
        />
      )}

      {loop.phase === 'paused' && (
        <PauseOverlay
          modeLabel={modeLabel}
          difficultyLabel={difficultyLabel}
          remain={loop.remain}
          score={loop.score}
          onResume={loop.togglePause}
          onRetry={onRetry}
          onDifficulty={onDifficulty}
          onHome={onHome}
        />
      )}
    </div>
  );
}
