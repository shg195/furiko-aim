// BackdropGrid.tsx — ハンドオフ準拠のサブティル背景グリッド
// `.backdrop` 要素として置き、CSS 側で radial gradient + grid mask を適用。

export default function BackdropGrid() {
  return <div className="backdrop" aria-hidden="true" />;
}
