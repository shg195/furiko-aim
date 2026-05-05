// CustomSlider.tsx — ハンドオフ準拠のカスタムスライダー
// ネイティブ <input type="range"> は使わず、トラック・ティック・ハンドルをすべて DOM で構築する。

import { useEffect, useRef } from 'react';

type Props = {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
};

export default function CustomSlider({ min, max, step, value, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = ((value - min) / (max - min)) * 100;

  const updateFromX = (clientX: number) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    let f = (clientX - r.left) / r.width;
    f = Math.max(0, Math.min(1, f));
    let v = min + f * (max - min);
    v = Math.round(v / step) * step;
    onChange(parseFloat(v.toFixed(4)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) updateFromX(e.clientX);
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
  });

  const ticks = 11;
  return (
    <div
      className="cslider"
      ref={trackRef}
      onMouseDown={(e) => {
        dragging.current = true;
        updateFromX(e.clientX);
      }}
    >
      <div className="cslider-track">
        {Array.from({ length: ticks }).map((_, i) => (
          <span
            key={i}
            className="cslider-tick"
            style={{ left: `${(i / (ticks - 1)) * 100}%` }}
          />
        ))}
        <div className="cslider-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="cslider-handle" style={{ left: `${pct}%` }}>
        <span className="cslider-handle-line" />
      </div>
    </div>
  );
}
