// ResultScreen.tsx — 結果画面
// 左：FINAL SCORE（big-score）+ 新記録バッジ + メタ + RETRY/DIFFICULTY/TITLE 3 ボタン
// 右：PERFECT SCORE 比較ブロック + 進捗バー + % of perfect
// 保存・共有ボタンは M10 で追加。

import TopChrome from '../components/TopChrome';
import { PERFECT_SCORE, PROFILES } from '../constants';
import { downloadBlob, makeResultPng } from '../lib/canvasShot';
import {
  isWebShareSupported,
  shareViaTwitter,
  shareViaWebShare,
} from '../lib/share';
import type { DifficultyKey, GameResult, HighScores } from '../types';

type Props = {
  result: GameResult;
  hs: HighScores;
  onRetry: () => void;
  onDifficulty: () => void;
  onTitle: () => void;
};

export default function ResultScreen({
  result,
  hs,
  onRetry,
  onDifficulty,
  onTitle,
}: Props) {
  const isCustom = result.mode === 'custom';
  const profile =
    !isCustom && result.profileKey
      ? PROFILES[result.profileKey as DifficultyKey]
      : null;
  const prevHS =
    !isCustom && result.profileKey ? hs[result.profileKey] ?? 0 : 0;
  const pctOfPerfect = (result.score / PERFECT_SCORE) * 100;
  const labelStr = isCustom
    ? 'CUSTOM'
    : profile
      ? `${profile.bobs}-${profile.label}`
      : '';

  const handleSave = async () => {
    const blob = await makeResultPng(result, labelStr);
    if (!blob) return;
    const filename = `furiko-aim-${labelStr.toLowerCase()}-${result.score}.png`;
    downloadBlob(blob, filename);
  };

  const buildShareText = () =>
    `振り子エイム — ${labelStr}: ${result.score.toLocaleString()} (${pctOfPerfect.toFixed(1)}% of perfect) #振り子エイム`;

  const buildShareUrl = () =>
    typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : undefined;

  const handleShare = async () => {
    let file: File | undefined;
    const blob = await makeResultPng(result, labelStr);
    if (blob) {
      file = new File([blob], 'furiko-aim-result.png', { type: 'image/png' });
    }
    await shareViaWebShare({ text: buildShareText(), url: buildShareUrl(), file });
  };

  const handleX = () => {
    shareViaTwitter({ text: buildShareText(), url: buildShareUrl() });
  };

  return (
    <div className="screen pad">
      <TopChrome
        left={<span className="muted mono small">06 / RESULT</span>}
        right={<span className="muted mono small">{labelStr}</span>}
      />
      <div className="result-layout">
        <div className="result-main">
          {result.isNew && (
            <div className="new-record">
              <span className="new-record-dot" />
              <span className="mono">NEW RECORD</span>
            </div>
          )}
          <div className="kicker mono">FINAL SCORE</div>
          <div className="big-score mono">{result.score.toLocaleString()}</div>
          <div className="result-meta">
            {isCustom ? (
              <div className="result-meta-row">
                <span className="muted">難易度</span>
                <span className="mono">CUSTOM</span>
              </div>
            ) : (
              <>
                <div className="result-meta-row">
                  <span className="muted">難易度</span>
                  <span className="mono">{labelStr}</span>
                </div>
                <div className="result-meta-row">
                  <span className="muted">ハイスコア</span>
                  <span className="mono">
                    {result.isNew ? (
                      <span className="accent-text">
                        {result.score.toLocaleString()}
                      </span>
                    ) : (
                      prevHS.toLocaleString()
                    )}
                  </span>
                </div>
                <div className="result-meta-row">
                  <span className="muted">プレイ時間</span>
                  <span className="mono">60.0s</span>
                </div>
              </>
            )}
          </div>
          <div className="result-cta">
            <button className="btn btn-primary" onClick={onRetry}>
              <span>RETRY</span>
              <span className="btn-arrow">↻</span>
            </button>
            <button className="btn btn-ghost" onClick={onDifficulty}>
              {isCustom ? 'CUSTOM' : 'DIFFICULTY'}
            </button>
            <button className="btn btn-ghost" onClick={onTitle}>
              TITLE
            </button>
          </div>
          <div className="result-actions">
            <button className="btn btn-ghost small" onClick={handleSave}>
              SAVE
            </button>
            {isWebShareSupported() && (
              <button className="btn btn-ghost small" onClick={handleShare}>
                SHARE
              </button>
            )}
            <button className="btn btn-ghost small" onClick={handleX}>
              X
            </button>
          </div>
        </div>

        <div className="result-side">
          <div className="result-stat">
            <div className="muted mono small">PERFECT SCORE</div>
            <div className="mono lg">{PERFECT_SCORE.toLocaleString()}</div>
            <div className="muted mono small">100% × 60s</div>
          </div>
          <div className="result-bar">
            <div
              className="result-bar-fill"
              style={{ width: `${Math.min(100, pctOfPerfect).toFixed(1)}%` }}
            />
          </div>
          <div className="result-pct mono">
            {pctOfPerfect.toFixed(1)}
            <span className="muted">% of perfect</span>
          </div>
        </div>
      </div>
    </div>
  );
}
