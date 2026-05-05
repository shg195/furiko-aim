// CountdownOverlay.tsx — 開始前 / Resume 時の 3-2-1-GO カウントダウン
// 数字は画面上部寄り、AIM HERE マーカーが先端を追従。
// 暗転・ぼかしは行わず、振り子と pivot を視認可能に保つ（spec 2.11）。

import type { Vec2 } from '../types';

type Props = {
  /** 表示する数字（3, 2, 1, 0=GO 直前） */
  count: number;
  modeLabel: string;
  /** Resume 時かどうか。サブラベルが「RESUMING」/「GET READY」で切り替わる */
  isResume: boolean;
  /** 先端おもりの CSS px 座標 */
  tipPos: Vec2;
};

export default function CountdownOverlay({
  count,
  modeLabel,
  isResume,
  tipPos,
}: Props) {
  return (
    <div className="countdown-overlay">
      <div
        className="tip-marker"
        style={{ left: tipPos.x, top: tipPos.y }}
      >
        <div className="tip-marker-ring" />
        <div className="tip-marker-label mono">AIM HERE</div>
      </div>
      <div className="countdown-num mono" key={count}>
        {count > 0 ? count : 'GO'}
      </div>
      <div className="countdown-sub mono small muted">
        {isResume ? 'RESUMING' : 'GET READY'} · {modeLabel}
      </div>
    </div>
  );
}
