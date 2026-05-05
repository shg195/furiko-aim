// 一時マウント（モジュール 2/3/4 検証用）。M6 の画面遷移実装で書き換え予定。

import { useState } from 'react';
import PendulumCanvas from './components/PendulumCanvas';
import { useGameLoop } from './hooks/useGameLoop';

export default function App() {
  const [finished, setFinished] = useState<number | null>(null);
  const loop = useGameLoop({
    scorable: true,
    onFinish: (final) => setFinished(final),
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0b0c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: '#fff',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', gap: 24 }}>
        <div>PHASE: {loop.phase}</div>
        <div>COUNT: {loop.count}</div>
        <div>REMAIN: {loop.remain.toFixed(1)}s</div>
        <div>SCORE: {Math.round(loop.score)}</div>
        <div>LIVE: {loop.live.toFixed(3)}</div>
      </div>
      <div style={{ width: 600, height: 600, position: 'relative' }}>
        <PendulumCanvas
          lengths={[1, 0.7]}
          showCursor
          trailScoring
          paused={loop.isPaused}
          feedbackStyle={loop.phase === 'playing' ? 'ring' : 'none'}
          onScoreChange={loop.handleScoreChange}
        />
        {loop.phase === 'countdown' && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 56,
              color: '#d21e1e',
              pointerEvents: 'none',
            }}
          >
            {loop.count > 0 ? loop.count : 'GO'}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={loop.togglePause} disabled={loop.phase === 'countdown' || loop.phase === 'ending'}>
          {loop.phase === 'paused' ? 'RESUME' : 'PAUSE'} (ESC/SPACE)
        </button>
      </div>
      {finished !== null && (
        <div style={{ color: '#d21e1e', fontSize: 18 }}>
          FINISHED: {Math.round(finished)} pts
        </div>
      )}
    </div>
  );
}
