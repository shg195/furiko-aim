// App.tsx — 画面ルータ（M6）。
// 画面遷移：title → mode → (difficulty | custom) → game → result。
// 一時停止メニューの RETRY / DIFFICULTY / HOME も結線。

import { useMemo, useState } from 'react';
import BackdropGrid from './components/BackdropGrid';
import { PROFILES } from './constants';
import { generateChaoticAngles } from './lib/chaos';
import CustomScreen from './screens/CustomScreen';
import DifficultyScreen from './screens/DifficultyScreen';
import GameScreen from './screens/GameScreen';
import ModeScreen from './screens/ModeScreen';
import ResultScreen from './screens/ResultScreen';
import TitleScreen from './screens/TitleScreen';
import './styles/game.css';
import type {
  BobCount,
  CustomConfig,
  DifficultyKey,
  GameMode,
  GameResult,
  HighScores,
  RunConfig,
  ScreenName,
  Tier,
} from './types';

const INITIAL_CUSTOM: CustomConfig = {
  bobs: 2,
  lengths: [1.0, 0.7, 0.5],
  angles: [Math.PI - 0.6, Math.PI + 0.4, Math.PI - 0.2],
};

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('title');
  const [mode, setMode] = useState<GameMode | null>(null);
  const [diffBobs, setDiffBobs] = useState<BobCount>(2);
  const [diffTier, setDiffTier] = useState<Tier>('normal');
  const [customCfg, setCustomCfg] = useState<CustomConfig>(INITIAL_CUSTOM);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [hs, setHS] = useState<HighScores>({}); // M9 で localStorage 化
  const [gameNonce, setGameNonce] = useState(0); // RETRY で乱数を再生成するためのキー

  const profileKey = `${diffBobs}-${diffTier}` as DifficultyKey;

  const runConfig = useMemo<RunConfig | null>(() => {
    if (mode === 'custom') {
      return {
        lengths: customCfg.lengths.slice(0, customCfg.bobs),
        angles: customCfg.angles.slice(0, customCfg.bobs),
        label: 'CUSTOM',
        scorable: true,
        profileKey: `custom-${customCfg.bobs}` as const,
      };
    }
    if (mode === 'normal') {
      const p = PROFILES[profileKey];
      const angles = generateChaoticAngles(p);
      return {
        lengths: p.lengths,
        angles,
        label: `${p.bobs}-${p.label}`,
        scorable: true,
        profileKey,
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, profileKey, customCfg, gameNonce]);

  const finishGame = (finalScore: number) => {
    const rounded = Math.round(finalScore);
    let isNew = false;
    if (runConfig && runConfig.profileKey) {
      const prev = hs[runConfig.profileKey];
      if (prev === undefined || rounded > prev) {
        const next: HighScores = { ...hs, [runConfig.profileKey]: rounded };
        setHS(next);
        isNew = true;
      }
    }
    setLastResult({
      score: rounded,
      isNew,
      mode: mode ?? 'normal',
      profileKey: runConfig?.profileKey ?? null,
    });
    setScreen('result');
  };

  const goTitle = () => {
    setScreen('title');
    setMode(null);
  };
  const goMode = () => setScreen('mode');
  const goDifficulty = () => {
    if (mode === 'custom') setScreen('custom');
    else setScreen('difficulty');
  };
  const handleRetry = () => {
    setGameNonce((n) => n + 1);
    setScreen('game');
  };

  return (
    <div className="app">
      <BackdropGrid />

      {screen === 'title' && <TitleScreen onStart={() => setScreen('mode')} />}

      {screen === 'mode' && (
        <ModeScreen
          onPick={(m) => {
            setMode(m);
            setScreen(m === 'normal' ? 'difficulty' : 'custom');
          }}
          onBack={goTitle}
        />
      )}

      {screen === 'difficulty' && (
        <DifficultyScreen
          bobs={diffBobs}
          tier={diffTier}
          hs={hs}
          onSetBobs={setDiffBobs}
          onSetTier={setDiffTier}
          onStart={() => {
            setGameNonce((n) => n + 1);
            setScreen('game');
          }}
          onBack={goMode}
        />
      )}

      {screen === 'custom' && (
        <CustomScreen
          onStart={() => {
            setCustomCfg(INITIAL_CUSTOM);
            setGameNonce((n) => n + 1);
            setScreen('game');
          }}
          onBack={goMode}
        />
      )}

      {screen === 'game' && runConfig && (
        <GameScreen
          key={gameNonce}
          config={runConfig}
          modeLabel={runConfig.label}
          onFinish={finishGame}
          onRetry={handleRetry}
          onDifficulty={goDifficulty}
          onHome={goTitle}
        />
      )}

      {screen === 'result' && lastResult && (
        <ResultScreen
          result={lastResult}
          hs={hs}
          onRetry={handleRetry}
          onDifficulty={goDifficulty}
          onTitle={goTitle}
        />
      )}
    </div>
  );
}
