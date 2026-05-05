// ModeScreen.tsx — モード選択画面（NORMAL / CUSTOM）
// 見出し SELECT MODE、kicker SELECT MODE、左に NORMAL（プライマリ）、右に CUSTOM。

import ModeCard from '../components/ModeCard';
import TopChrome from '../components/TopChrome';
import type { GameMode } from '../types';

type Props = {
  onPick: (mode: GameMode) => void;
  onBack: () => void;
};

export default function ModeScreen({ onPick, onBack }: Props) {
  return (
    <div className="screen pad">
      <TopChrome
        left={
          <button className="link-back" onClick={onBack}>
            ← BACK
          </button>
        }
        right={<span className="muted mono small">02 / MODE</span>}
      />
      <div className="centered-stack">
        <div className="kicker mono">SELECT MODE</div>
        <h2 className="screen-title">SELECT MODE</h2>
        <div className="mode-grid">
          <ModeCard
            tag="01"
            title="NORMAL"
            jp="ノーマル"
            desc="プリセット難易度で挑戦。ハイスコア記録対象。"
            meta={[
              '2-BOB / 3-BOB × EASY · NORMAL · HARD',
              'CHAOS-VERIFIED',
              'HIGH SCORE: ON',
            ]}
            onClick={() => onPick('normal')}
            primary
          />
          <ModeCard
            tag="02"
            title="CUSTOM"
            jp="カスタム"
            desc="おもり数・ロッド長・初期角度を自由設定。"
            meta={['BOBS: 2 / 3', 'LENGTHS · ANGLES', 'HIGH SCORE: ON']}
            onClick={() => onPick('custom')}
          />
        </div>
      </div>
    </div>
  );
}
