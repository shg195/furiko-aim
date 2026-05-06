# 振り子エイム（Furiko-Aim）

🎮 **遊ぶ：https://shg195.github.io/furiko-aim/**

URL を開くだけで遊べます。インストール・ログイン・アカウント作成不要。ハイスコアは各自のブラウザに自動保存されます。

カオス振り子（二重・三重振り子）の先端おもりをマウスカーソルで追跡し、追従精度をスコア化するブラウザエイムゲーム。

- プラットフォーム：Web ブラウザ（PC、マウス操作前提）
- プレイ時間：1 ゲーム 60 秒
- スコア：毎フレームの距離スコアを累積。理論最大 6,000（PERFECT SCORE）

## 機能

- ノーマルモード：6 プロファイル（2-bob / 3-bob × Easy / Normal / Hard）。各プロファイルでハイスコアを localStorage に保存
- カスタムモード：おもり数（2 または 3）・ロッド長・初期角度を自由設定。プレビュー振り子を直接ドラッグして調整も可能
- カオス保証：ノーマル開始時に乱数生成された初期角度をシミュレーションで検証し、十分カオス的に動くものを採用
- 軌跡なぞりスコア：先端追跡に加え、直近 500ms の軌跡への近接でも加点
- 結果画面：FINAL SCORE / 新記録判定 / RETRY / DIFFICULTY / TITLE / SAVE（PNG）/ SHARE（Web Share API）/ X（Twitter intent）

## 技術スタック

- TypeScript + React 18
- Vite 8
- HTML5 Canvas 2D
- 永続化：localStorage（サーバー不要）
- 共有：Web Share API + Twitter intent

## ディレクトリ構成

```
src/
  App.tsx                  # 画面ルータ
  main.tsx                 # エントリ
  types.ts                 # 共通型
  constants.ts             # 共通定数（プロファイル・物理定数等）
  index.css                # 最小ベース
  lib/                     # 純関数ロジック
    physics.ts             # n 振り子 RK4 物理シミュレーション
    scoring.ts             # 距離スコア（tip + trail max）
    chaos.ts               # カオス保証（初期角度検証）
    storage.ts             # localStorage（HS）
    canvasShot.ts          # 結果画面 PNG 生成
    share.ts               # Web Share API / Twitter intent
  hooks/
    useGameLoop.ts         # 60 秒タイマー・カウントダウン・一時停止・累積スコア
    useHighScores.ts       # HS state + localStorage 同期
  components/              # 描画・UI 部品
    PendulumCanvas.tsx
    HUD.tsx
    PrecisionMeter.tsx
    TimeBar.tsx
    CountdownOverlay.tsx
    PauseOverlay.tsx
    BackdropGrid.tsx
    TopChrome.tsx
    ModeCard.tsx
    DifficultyCard.tsx
    CustomSlider.tsx
    AngleDial.tsx
  screens/                 # 画面コンポーネント
    TitleScreen.tsx
    ModeScreen.tsx
    DifficultyScreen.tsx
    CustomScreen.tsx
    GameScreen.tsx
    ResultScreen.tsx
  styles/
    game.css               # 全画面・コンポーネントの CSS
docs/
  spec.md                  # 仕様書（正典）
  design.md                # UI デザイン参照
  design-handoff/          # claude design からのハンドオフ
  conventions.md           # 命名・構造・規約
  audit-reports/           # 全体監査レポート
```

## インストール

```sh
git clone https://github.com/<user>/furiko-aim.git
cd furiko-aim
npm install
```

## 起動

開発モード（HMR 付き）：
```sh
npm run dev
```
→ `http://localhost:5173/`

本番ビルド + プレビュー（GitHub Pages 公開時と同じパスで動作確認）：
```sh
npm run build
npm run preview
```
→ `http://localhost:4173/furiko-aim/`

## 使い方

### 操作
- マウス：先端おもりを追跡
- `Enter`：タイトルから開始
- `ESC` または `Space`：ゲーム中の一時停止 / 再開

### 画面遷移
```
タイトル → SELECT MODE → SELECT DIFFICULTY または CUSTOM →
  カウントダウン (3-2-1-GO) → ゲーム (60 秒) → 結果
```

### ゲーム画面 HUD
- 左上：PAUSE ボタン
- 上中央：残時間（数字）+ time-bar
- 右上：累積 SCORE と PRECISION メーター（直近フレームの瞬間スコア）

### 一時停止メニュー
RESUME / RETRY / DIFFICULTY（カスタム時は CUSTOM）/ HOME

### 結果画面
- 左：FINAL SCORE / 新記録バッジ / 難易度・ハイスコア・プレイ時間 / RETRY・DIFFICULTY・TITLE
- 右：PERFECT SCORE 比較バーと % of perfect
- 下：SAVE（PNG ダウンロード）/ SHARE（OS 標準シェア、対応端末）/ X（Twitter 投稿画面）

## 仕様詳細

機能仕様は [`docs/spec.md`](docs/spec.md) を、UI 参照は [`docs/design.md`](docs/design.md) と [`docs/design-handoff/`](docs/design-handoff/) を参照。

## デプロイ

GitHub Pages で公開中：**https://shg195.github.io/furiko-aim/**

- `.github/workflows/deploy.yml` の GitHub Actions により、`main` ブランチへの push で自動的にビルド→デプロイ
- `vite.config.ts` の `base: '/furiko-aim/'` でアセットパスをリポジトリ名に合わせている
- リポジトリ名を変更する場合は `base` も合わせて変更

## ライセンス

未設定（個人開発）。必要に応じて追加してください。
