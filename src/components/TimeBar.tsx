// TimeBar.tsx — 残時間を可視化する細いバー（pct=1.0 で満タン、0 で空）

type Props = {
  /** 0..1 の残時間割合 */
  pct: number;
};

export default function TimeBar({ pct }: Props) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="time-bar">
      <div
        className="time-bar-fill"
        style={{ transform: `scaleX(${clamped})` }}
      />
    </div>
  );
}
