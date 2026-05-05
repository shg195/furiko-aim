// ModeCard.tsx — モード選択画面のカード（NORMAL / CUSTOM）

type Props = {
  tag: string;
  title: string;
  jp: string;
  desc: string;
  meta: string[];
  primary?: boolean;
  onClick: () => void;
};

export default function ModeCard({
  tag,
  title,
  jp,
  desc,
  meta,
  primary = false,
  onClick,
}: Props) {
  return (
    <button
      className={`mode-card${primary ? ' primary' : ''}`}
      onClick={onClick}
    >
      <div className="mode-card-top">
        <span className="mono small muted">{tag}</span>
        <span className="mode-card-arrow">→</span>
      </div>
      <div className="mode-card-titles">
        <div className="mode-card-jp">{jp}</div>
        <div className="mode-card-en mono">{title}</div>
      </div>
      <p className="mode-card-desc">{desc}</p>
      <ul className="mode-card-meta mono small">
        {meta.map((m, i) => (
          <li key={i}>· {m}</li>
        ))}
      </ul>
    </button>
  );
}
