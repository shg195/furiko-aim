# UI デザイン参照

本ドキュメントは UI の見た目・雰囲気を定義する。機能仕様は `spec.md` を参照。

## 1. ハンドオフ元
- `docs/design-handoff/`（claude design からのハンドオフ一式）
  - `README.md`：ハンドオフの読み方
  - `chats/chat1.md`：ユーザーとデザインエージェントの対話履歴（意図と最終決定）
  - `project/`：HTML/CSS/JS プロトタイプ一式
    - `index.html`：エントリ
    - `app.jsx`：全画面の React コンポーネント
    - `pendulum-canvas.jsx`：Canvas 描画コンポーネント
    - `pendulum-physics.jsx`：物理シミュレーション
    - `styles.css`：スタイル一式
    - `tweaks-panel.jsx`：調整パネル

## 2. デザイン原則（ムード資料より）
- **ダーク基調**：背景は `#0a0b0c` を起点とした暗色。要素は白を varied opacity で重ねる
- **モノクロ＋単色アクセント**：白〜薄グレーのベースに **アクセント1色のみ**。多色化禁止
- **シンプル**：装飾を最小限に。振り子と軌跡が視覚的主役
- 雰囲気：精密機器・現代アート的ソフトウェア UI（FPS エイムトレーナー的サイバー感は避ける）

## 3. タイポグラフィ
- UI（chrome）：Inter
- 日本語：Noto Sans JP
- 数値・テクニカルラベル：JetBrains Mono（mono）
- 数字には mono を使用。状況に応じて `data-mono` トグルで切替

## 4. パレット
- 背景：`#0a0b0c`（暖冷の重ねグレーで段差を作る）
- 前景：白を varied opacity（0.06 / 0.18 / 0.25 / 0.35 / 0.5 / 0.65 / 0.85 / 1.0）
- アクセント既定：**`#d21e1e`（RGB 210, 30, 30、赤）**

## 5. モーション
- 既定は静的。クワイエット
- アクセント発光は軌跡とスコアフィードバックに限定（パルス・グロー）
- カウントダウンは数字のフェード/スケール、AIM HERE マーカーは pulse

## 6. 主要コンポーネントの仕様（ハンドオフ実装より）

### 6.1 タイトル
- 大見出し：`振り<span class="accent">り</span>子\nエイム`（`り` を accent 色に）
- サブ：`予測不能な振り子の軌跡を辿る`
- アンビエント振り子（背景で動く・カーソル非追跡）
- CTA：`START →`、Enter キーで発火

### 6.2 モード選択（SELECT MODE）
- kicker：`SELECT MODE`、見出し：`SELECT MODE`（旧「どう遊ぶ？」を英語化）
- 2 カード：`NORMAL`（プライマリ）と `CUSTOM`
- 各カード：番号（01/02）、英タイトル、日本語サブ、説明、メタ箇条書き

### 6.3 難易度選択（SELECT DIFFICULTY）
- kicker：`NORMAL MODE`、見出し：`SELECT DIFFICULTY`
- セグメントトグル：`2-BOB / 3-BOB`（PENDULUM ラベル付）
- カード×3：Easy / Normal / Hard。各カードに振り子姿勢 SVG プレビュー＋RATIO/JITTER/HI-SCORE
- 下部 CTA：`SELECTED · {2|3}-{LABEL}` と `START →` ボタン

### 6.4 カスタム（パラメータ設定）
- 左：パラメータ欄（おもり数セグメント・ロッド長スライダー・角度ダイヤル）
- 右：プレビュー（キャンバス＋静止/再生トグル）と独立 START CTA
- スライダー：カスタムスタイル（ネイティブ不可）
- 角度ダイヤル：円形 UI、ドラッグで角度設定
- スクロールが要る場合もカスタムスクロールバーで統一
- プレビュー直接ドラッグ：おもり=角度、ロッド端=長さ

### 6.5 ゲーム HUD
- 左上：`PAUSE` ピル（ESC/SPACE 表記）
- 上中央：MODE と TIME（残秒）+ time-bar
- 右上：SCORE と PRECISION（16 セルメーター）+ %
- 下部：旧 ABORT は撤去（一時停止メニューに集約）
- カウントダウン中は半透明化または通常表示、AIM HERE マーカーは先端追従

### 6.6 一時停止オーバーレイ
- ボタン：`RESUME / RETRY / DIFFICULTY / HOME`
- 残時間とスコアを表示
- `[ESC]` / `[SPACE]` 表記

### 6.7 結果画面
- 左：FINAL SCORE（大型数字）、新記録バッジ、メタ、`RETRY / DIFFICULTY / TITLE` 3 ボタン、保存・共有
- 右：PERFECT SCORE（6,000）、進捗バー、`X% of perfect`
  - 右ブロックの数字は左 big-score と視覚階層を揃える程度に大きく

### 6.8 軌跡・フィードバック
- 軌跡スタイル：glow（既定）/ particles / dual。500ms フェード
- カーソルフィードバック：ring（既定）/ tether line / vignette pulse / all / none
- 先端おもりは accent ring + 動的 glow

## 7. アイコン
- PauseIcon、PlayIcon は単純な SVG（rect/path、currentColor）
- BACK は `← BACK` テキストリンク
- 矢印は `→`／`↻` 文字 / SVG 任意

## 8. レスポンシブ
- PC 前提。モバイル幅でも破綻しない（未テストでも要素が overflow しない・タッチ操作は非対応）
- 短辺基準のキャンバスサイズ（フィールド半径 = 短辺 × 0.42）

## 9. 注意事項
- ハンドオフのコード（JSX/CSS）はあくまでプロトタイプ。**ピクセル単位で再現するが、内部構造はそのままコピーしない**（React + TS + Vite 構成へ移植）
- ユーザー指摘の既知バグ・改善点は `spec.md` に統合済み（カスタム3おもり時の角度操作、スクロールバー、HUD配置、ボタン構成、英語化、結果画面サイズ、保存・共有、プレビュー直接ドラッグ）

## 10. Tweaks パネルの扱い
- ハンドオフでは右下に常設の調整パネル（accent / trailStyle / feedbackStyle / monoNumerics / trailScoring）
- **本番での扱いは実装段階で確定**（候補：(a)隠す＝既定値固定、(b)残す＝ライブ調整可、(c)開発ビルドのみ）
