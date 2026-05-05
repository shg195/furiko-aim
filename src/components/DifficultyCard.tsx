// DifficultyCard.tsx — 難易度選択画面の各カード（Easy / Normal / Hard）
// SVG プレビュー（鉛直下向き静止 + ジッター範囲を扇で表現）+ メタ情報 + 現在ハイスコア

import type { DifficultyProfile } from '../types';

type Props = {
  data: DifficultyProfile;
  selected: boolean;
  hs?: number;
  onClick: () => void;
};

function DiffPreview({ lengths, jitterDeg }: { lengths: number[]; jitterDeg: number }) {
  const svgSize = 120;
  const total = lengths.reduce((a, b) => a + b, 0);
  const r = svgSize * 0.4;
  const scale = r / total;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  let x = cx;
  let y = cy;
  const pts: { x: number; y: number }[] = [{ x, y }];
  for (const L of lengths) {
    y -= L * scale;
    pts.push({ x, y });
  }
  const jitter = (jitterDeg * Math.PI) / 180;
  const arcX1 = cx + Math.sin(-jitter) * r;
  const arcY1 = cy - Math.cos(-jitter) * r;
  const arcX2 = cx + Math.sin(jitter) * r;
  const arcY2 = cy - Math.cos(jitter) * r;
  const largeArc = jitterDeg > 90 ? 1 : 0;
  return (
    <div className="diff-preview">
      <svg viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeDasharray="2 3"
        />
        <path
          d={`M ${arcX1} ${arcY1} A ${r} ${r} 0 ${largeArc} 1 ${arcX2} ${arcY2}`}
          stroke="var(--accent)"
          strokeWidth="1.2"
          fill="none"
          opacity="0.5"
        />
        {pts.slice(1).map((p, i) => (
          <line
            key={i}
            x1={pts[i].x}
            y1={pts[i].y}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        ))}
        {pts.map((p, i) => (
          <circle
            key={`b${i}`}
            cx={p.x}
            cy={p.y}
            r={i === 0 ? 1.6 : i === pts.length - 1 ? 3.5 : 2.6}
            fill={i === pts.length - 1 ? '#fff' : 'rgba(255,255,255,0.65)'}
          />
        ))}
        {pts.length > 1 && (
          <circle
            cx={pts[pts.length - 1].x}
            cy={pts[pts.length - 1].y}
            r="5.5"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1"
            opacity="0.7"
          />
        )}
      </svg>
    </div>
  );
}

export default function DifficultyCard({
  data,
  selected,
  hs,
  onClick,
}: Props) {
  return (
    <button
      className={`diff-card${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <DiffPreview lengths={data.lengths} jitterDeg={data.jitterDeg} />
      <div className="diff-card-foot">
        <div className="diff-foot-row">
          <span className="muted mono xs">RATIO</span>
          <span className="mono xs">{data.lengths.join(':')}</span>
        </div>
        <div className="diff-foot-row">
          <span className="muted mono xs">JITTER</span>
          <span className="mono xs">±{data.jitterDeg}°</span>
        </div>
        <div className="diff-foot-row hi">
          <span className="muted mono xs">HI-SCORE</span>
          <span className="mono xs accent-text">
            {hs ? hs.toLocaleString() : '—'}
          </span>
        </div>
      </div>
      {selected && <div className="diff-selected-bar" />}
    </button>
  );
}
