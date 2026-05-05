// storage.ts — ハイスコアの localStorage 永続化（純関数）
//
// spec 2.10 / spec 6 に従い、サーバー DB なし。localStorage が使えない・データ破損時は
// 空オブジェクトをフォールバック値として返す。

import { HS_STORAGE_KEY } from '../constants';
import type { HighScoreKey, HighScores } from '../types';

/** 既知の HighScoreKey 一覧（受け取り時のホワイトリスト） */
const KNOWN_KEYS: ReadonlySet<HighScoreKey> = new Set<HighScoreKey>([
  '2-easy',
  '2-normal',
  '2-hard',
  '3-easy',
  '3-normal',
  '3-hard',
  'custom-2',
  'custom-3',
]);

export function loadHighScores(): HighScores {
  try {
    const raw = localStorage.getItem(HS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: HighScores = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (KNOWN_KEYS.has(k as HighScoreKey) && typeof v === 'number' && Number.isFinite(v)) {
        out[k as HighScoreKey] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveHighScores(hs: HighScores): void {
  try {
    localStorage.setItem(HS_STORAGE_KEY, JSON.stringify(hs));
  } catch {
    // QuotaExceeded やプライベートブラウジングなど。失敗時は無視する（spec 5.2 方針）
  }
}
