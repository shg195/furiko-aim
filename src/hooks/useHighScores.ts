// useHighScores.ts — HighScores の state を localStorage と同期する
// spec 2.10。マウント時に load、setter 経由で save。

import { useCallback, useState } from 'react';
import { loadHighScores, saveHighScores } from '../lib/storage';
import type { HighScores } from '../types';

export function useHighScores(): [HighScores, (next: HighScores) => void] {
  const [hs, setHsState] = useState<HighScores>(() => loadHighScores());

  const setHs = useCallback((next: HighScores) => {
    setHsState(next);
    saveHighScores(next);
  }, []);

  return [hs, setHs];
}
