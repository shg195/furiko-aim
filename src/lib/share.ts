// share.ts — シェア機能（Web Share API / Twitter intent をそれぞれ独立に提供）
//
// spec 6 / 3.5。
// Web Share API は OS 標準のシェアシートを開く（モバイル中心）。
// Twitter intent（X）は常時利用可能で、ブラウザ新タブで投稿画面を開く。

type ShareTextOpts = {
  text: string;
  url?: string;
};

type WebShareOpts = ShareTextOpts & {
  /** 添付したい画像。canShare で許可された場合のみ添付 */
  file?: File;
};

/** Web Share API が現在の環境で利用可能か */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Web Share API でシェアする。失敗・キャンセル・未対応の場合は false を返す。
 */
export async function shareViaWebShare(opts: WebShareOpts): Promise<boolean> {
  if (!isWebShareSupported()) return false;
  try {
    const data: ShareData = { text: opts.text };
    if (opts.url) data.url = opts.url;
    if (
      opts.file &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [opts.file] })
    ) {
      data.files = [opts.file];
    }
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Twitter（X）intent を新タブで開く。常時利用可能。
 */
export function shareViaTwitter(opts: ShareTextOpts): void {
  const params = new URLSearchParams();
  params.set('text', opts.text);
  if (opts.url) params.set('url', opts.url);
  window.open(
    `https://twitter.com/intent/tweet?${params.toString()}`,
    '_blank',
    'noopener',
  );
}
