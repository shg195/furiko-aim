// 一時マウント（モジュール 2 検証用）。M6 の画面遷移実装で書き換え予定。

import PendulumCanvas from './components/PendulumCanvas';

export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0b0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 600, height: 600 }}>
        <PendulumCanvas lengths={[1, 0.7]} />
      </div>
    </div>
  );
}
