// TopChrome.tsx — ハンドオフの .chrome 共通ヘッダ。左右にコンテンツを置けるシンプルな器。

import type { ReactNode } from 'react';

type Props = {
  left?: ReactNode;
  right?: ReactNode;
};

export default function TopChrome({ left, right }: Props) {
  return (
    <div className="chrome">
      <div className="chrome-l">{left}</div>
      <div className="chrome-r">{right}</div>
    </div>
  );
}
