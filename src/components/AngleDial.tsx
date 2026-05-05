// AngleDial.tsx — ハンドオフ準拠の角度ダイヤル
// 円形 UI、ドラッグでハンドル位置を変更し角度（rad）を出力。
// θ=0 は鉛直下向き、θ=π は鉛直上向き（spec 4.1）。

import { useEffect, useRef } from 'react';

type Props = {
  /** 角度（rad、θ=0 鉛直下向き、θ=π 鉛直上向き） */
  angle: number;
  onChange: (rad: number) => void;
};

export default function AngleDial({ angle, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const size = 110;

  // 最新の onChange を ref で参照（ドラッグ中の stale closure を回避）
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const updateFromEvent = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    onChangeRef.current(Math.atan2(dx, dy));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) updateFromEvent(e);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  const bx = cx + Math.sin(angle) * r;
  const by = cy + Math.cos(angle) * r;

  return (
    <div
      className="angle-dial"
      ref={ref}
      onMouseDown={(e) => {
        dragging.current = true;
        updateFromEvent(e.nativeEvent);
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
        />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = cx + Math.sin(a) * (r - 3);
          const y1 = cy - Math.cos(a) * (r - 3);
          const x2 = cx + Math.sin(a) * (r + 1);
          const y2 = cy - Math.cos(a) * (r + 1);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.6"
            />
          );
        })}
        <text
          x={cx}
          y={cy - r - 4}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="7"
          fontFamily="JetBrains Mono, monospace"
        >
          UP
        </text>
        <line
          x1={cx}
          y1={cy}
          x2={bx}
          y2={by}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.5)" />
        <circle cx={bx} cy={by} r="5" fill="#fff" />
        <circle
          cx={bx}
          cy={by}
          r="8"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
