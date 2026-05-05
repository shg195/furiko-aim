// DifficultyScreen.tsx — 難易度選択画面（NORMAL モード）
// 上部：BACK / 03 ラベル
// 中央：kicker NORMAL MODE → screen-title SELECT DIFFICULTY → bobs-toggle (2/3) → diff-grid (3 cards)
// 下部：SELECTED 表記 + START CTA

import DifficultyCard from '../components/DifficultyCard';
import TopChrome from '../components/TopChrome';
import { PROFILES } from '../constants';
import type { BobCount, DifficultyKey, HighScores, Tier } from '../types';

type Props = {
  bobs: BobCount;
  tier: Tier;
  hs: HighScores;
  onSetBobs: (n: BobCount) => void;
  onSetTier: (t: Tier) => void;
  onStart: () => void;
  onBack: () => void;
};

const TIERS: Tier[] = ['easy', 'normal', 'hard'];

export default function DifficultyScreen({
  bobs,
  tier,
  hs,
  onSetBobs,
  onSetTier,
  onStart,
  onBack,
}: Props) {
  const sel = PROFILES[`${bobs}-${tier}` as DifficultyKey];
  return (
    <div className="screen pad">
      <TopChrome
        left={
          <button className="link-back" onClick={onBack}>
            ← BACK
          </button>
        }
        right={<span className="muted mono small">03 / DIFFICULTY</span>}
      />
      <div className="centered-stack wide">
        <div className="kicker mono">NORMAL MODE</div>
        <h2 className="screen-title">SELECT DIFFICULTY</h2>

        <div className="bobs-toggle">
          <span className="bobs-toggle-lbl mono small muted">PENDULUM</span>
          <div className="seg lg-seg">
            {([2, 3] as BobCount[]).map((n) => (
              <button
                key={n}
                className={`seg-btn${bobs === n ? ' on' : ''}`}
                onClick={() => onSetBobs(n)}
              >
                {n}-BOB
              </button>
            ))}
          </div>
        </div>

        <div className="diff-grid">
          {TIERS.map((t) => {
            const key = `${bobs}-${t}` as DifficultyKey;
            const data = PROFILES[key];
            return (
              <DifficultyCard
                key={key}
                data={data}
                selected={tier === t}
                hs={hs[key]}
                onClick={() => onSetTier(t)}
              />
            );
          })}
        </div>

        <div className="diff-cta">
          <span className="muted mono small">
            SELECTED · {sel.bobs}-{sel.label}
          </span>
          <button className="btn btn-primary lg" onClick={onStart}>
            <span>START</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
