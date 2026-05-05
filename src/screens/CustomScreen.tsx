// CustomScreen.tsx — M6 ではスタブ。M8 で本実装（パラメータ調整 + プレビュー直接ドラッグ）。

import TopChrome from '../components/TopChrome';

type Props = {
  onStart: () => void;
  onBack: () => void;
};

export default function CustomScreen({ onStart, onBack }: Props) {
  return (
    <div className="screen pad">
      <TopChrome
        left={
          <button className="link-back" onClick={onBack}>
            ← BACK
          </button>
        }
        right={<span className="muted mono small">02b / CUSTOM</span>}
      />
      <div className="centered-stack">
        <div className="kicker mono">CUSTOM SETUP</div>
        <h2 className="screen-title">パラメータを設定</h2>
        <p className="muted" style={{ marginBottom: 32 }}>
          カスタム画面はモジュール 8 で実装予定。今はデフォルトパラメータで開始できます。
        </p>
        <div className="cta-row">
          <button className="btn btn-primary lg" onClick={onStart}>
            <span>START (default)</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
