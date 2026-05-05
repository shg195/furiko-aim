// 一時マウント（モジュール 2/3 検証用）。M6 の画面遷移実装で書き換え予定。

import { useState } from 'react';
import PendulumCanvas from './components/PendulumCanvas';

export default function App() {
  const [score, setScore] = useState(0);
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
      <div style={{ width: 600, height: 600 }}>
        <PendulumCanvas
          lengths={[1, 0.7]}
          showCursor
          trailScoring
          onScoreChange={setScore}
        />
      </div>
      <div>SCORE/FRAME: {score.toFixed(3)}</div>
    </div>
  );
}
