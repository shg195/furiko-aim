// 一時マウント（モジュール 5 検証用）。M6 の画面遷移実装で書き換え予定。

import { useState } from 'react';
import CountdownOverlay from './components/CountdownOverlay';
import HUD from './components/HUD';
import PauseOverlay from './components/PauseOverlay';
import PendulumCanvas from './components/PendulumCanvas';
import { TOTAL_SECONDS } from './constants';
import { useGameLoop } from './hooks/useGameLoop';
import './styles/game.css';
import type { Vec2 } from './types';

export default function App() {
  const [tipPos, setTipPos] = useState<Vec2>({ x: 0, y: 0 });
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const loop = useGameLoop({
    scorable: true,
    onFinish: (final) => setFinalScore(final),
  });
  const isResume = loop.remain < TOTAL_SECONDS;

  return (
    <div className="game-screen">
      <div className="game-canvas-wrap">
        <PendulumCanvas
          lengths={[1, 0.7]}
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
          modeLabel="2-NORMAL"
          isResume={isResume}
          tipPos={tipPos}
        />
      )}

      {loop.phase === 'paused' && (
        <PauseOverlay
          modeLabel="2-NORMAL"
          remain={loop.remain}
          score={loop.score}
          onResume={loop.togglePause}
          onRetry={() => console.log('RETRY (M6 で実装)')}
          onDifficulty={() => console.log('DIFFICULTY (M6 で実装)')}
          onHome={() => console.log('HOME (M6 で実装)')}
        />
      )}

      {finalScore !== null && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#d21e1e',
            fontFamily: 'monospace',
            fontSize: 18,
          }}
        >
          FINISHED: {Math.round(finalScore)} pts (M6 で結果画面)
        </div>
      )}
    </div>
  );
}
