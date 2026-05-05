// PrecisionMeter.tsx — 16 セルの精度メーター。value (0..1) に応じてセルが accent 色で点灯。

type Props = {
  /** 0..1 のスコア */
  value: number;
  cells?: number;
};

export default function PrecisionMeter({ value, cells = 16 }: Props) {
  const lit = Math.round(Math.max(0, Math.min(1, value)) * cells);
  return (
    <div className="meter">
      {Array.from({ length: cells }).map((_, i) => (
        <div
          key={i}
          className={`meter-cell${i < lit ? ' on' : ''}`}
        />
      ))}
    </div>
  );
}
