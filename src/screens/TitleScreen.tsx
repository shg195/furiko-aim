// TitleScreen.tsx — タイトル画面
// 背景にアンビエント振り子、メイン見出し「振り子エイム」、サブ「予測不能な振り子の軌跡を辿る」
// START ボタン または Enter キーで次画面へ。

import { useEffect } from 'react';
import PendulumCanvas from '../components/PendulumCanvas';

type Props = {
  onStart: () => void;
};

export default function TitleScreen({ onStart }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="screen title-screen">
      <div className="title-stage">
        <div className="title-pendulum">
          <PendulumCanvas lengths={[1, 0.7]} ambient showCursor={false} />
        </div>
        <div className="title-text">
          <h1 className="hero-title">
            振<span className="accent">り</span>子<br />
            エイム
          </h1>
          <p className="hero-sub">予測不能な振り子の軌跡を辿る</p>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={onStart}>
              <span>START</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
