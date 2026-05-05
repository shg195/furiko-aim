// CustomScreen.tsx — カスタムモードのパラメータ設定画面（M8 本実装）
// spec 2.5.2 / 3.2 / 3.3。
// 左：パラメータ欄（おもり数 / ロッド長スライダー / 角度ダイヤル）
// 右：プレビュー（カスタムスタイルの canvas）+ START CTA + PREVIEW トグル

import { useCallback, useEffect, useRef, useState } from 'react';
import AngleDial from '../components/AngleDial';
import CustomSlider from '../components/CustomSlider';
import PendulumCanvas from '../components/PendulumCanvas';
import TopChrome from '../components/TopChrome';
import type { BobCount, CustomConfig } from '../types';

type Props = {
  cfg: CustomConfig;
  onChange: (next: CustomConfig) => void;
  onStart: () => void;
  onBack: () => void;
};

const LEN_MIN = 0.3;
const LEN_MAX = 1.5;
const LEN_STEP = 0.05;

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4l14 8-14 8z" />
    </svg>
  );
}

export default function CustomScreen({ cfg, onChange, onStart, onBack }: Props) {
  const [previewPlaying, setPreviewPlaying] = useState(false);

  // ドラッグハンドラから現在の cfg を読むための ref。
  // 直接 cfg を closure に閉じ込めると毎レンダーでハンドラ参照が変わり、
  // PendulumCanvas の useEffect が再実行されて振り子が点滅する。
  const cfgRef = useRef(cfg);
  useEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);

  const setBobs = (n: BobCount) => onChange({ ...cfg, bobs: n });
  const setLength = (i: number, v: number) => {
    const lengths = [...cfg.lengths];
    lengths[i] = v;
    onChange({ ...cfg, lengths });
  };
  const setAngle = (i: number, rad: number) => {
    const angles = [...cfg.angles];
    angles[i] = rad;
    onChange({ ...cfg, angles });
  };
  // PendulumCanvas に渡すドラッグハンドラ：参照安定（useCallback + cfgRef）
  const handleEditBob = useCallback(
    (idx: number, length: number, angle: number) => {
      const current = cfgRef.current;
      const lengths = [...current.lengths];
      const angles = [...current.angles];
      lengths[idx] = Math.max(LEN_MIN, Math.min(LEN_MAX, length));
      angles[idx] = angle;
      onChange({ ...current, lengths, angles });
    },
    [onChange],
  );

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

      <div className="custom-layout">
        <div className="custom-controls">
          <div className="kicker mono">CUSTOM SETUP</div>
          <h2 className="screen-title">パラメータを設定</h2>

          <div className="ctrl-block">
            <div className="ctrl-label">
              <span>おもり数</span>
              <span className="muted mono small">N = {cfg.bobs}</span>
            </div>
            <div className="seg">
              {([2, 3] as BobCount[]).map((n) => (
                <button
                  key={n}
                  className={`seg-btn${cfg.bobs === n ? ' on' : ''}`}
                  onClick={() => setBobs(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {Array.from({ length: cfg.bobs }).map((_, i) => (
            <div key={i} className="ctrl-block">
              <div className="ctrl-label">
                <span>
                  ロッド {i + 1}{' '}
                  <span className="muted mono small">
                    L<sub>{i + 1}</sub>
                  </span>
                </span>
                <span className="mono small accent-text">
                  {cfg.lengths[i].toFixed(2)}
                </span>
              </div>
              <CustomSlider
                min={LEN_MIN}
                max={LEN_MAX}
                step={LEN_STEP}
                value={cfg.lengths[i]}
                onChange={(v) => setLength(i, v)}
              />
              <div className="ctrl-label tight">
                <span>
                  初期角度{' '}
                  <span className="muted mono small">
                    θ<sub>{i + 1}</sub>
                  </span>
                </span>
                <span className="mono small accent-text">
                  {Math.round(((cfg.angles[i] - Math.PI) * 180) / Math.PI)}°
                </span>
              </div>
              <AngleDial
                angle={cfg.angles[i]}
                onChange={(rad) => setAngle(i, rad)}
              />
            </div>
          ))}
        </div>

        <div className="custom-preview">
          <div className="preview-frame">
            <div className="preview-canvas">
              <PendulumCanvas
                lengths={cfg.lengths.slice(0, cfg.bobs)}
                initialAngles={cfg.angles.slice(0, cfg.bobs)}
                paused={!previewPlaying}
                ambient
                showCursor={false}
                editable={!previewPlaying}
                onEditBob={handleEditBob}
              />
            </div>
            <div className="preview-meta-bar mono small muted">
              <span>N={cfg.bobs}</span>
              <span>{previewPlaying ? '◉ LIVE' : '◯ STILL'}</span>
            </div>
          </div>

          <div className="custom-cta-row">
            <button
              className={`preview-toggle-pill${previewPlaying ? ' on' : ''}`}
              onClick={() => setPreviewPlaying((p) => !p)}
            >
              {previewPlaying ? <PauseIcon /> : <PlayIcon />}
              <span className="mono small">
                {previewPlaying ? 'STOP' : 'PREVIEW'}
              </span>
            </button>
            <button
              className="btn btn-primary lg start-glow"
              onClick={onStart}
            >
              <span>START</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
          <div className="custom-cta-meta muted mono xs">
            記録対象 / HIGH SCORE TRACKED · CUSTOM-{cfg.bobs}
          </div>
        </div>
      </div>
    </div>
  );
}
