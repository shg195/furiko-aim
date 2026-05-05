# 共通規約

本書はモジュール 0 で確定した規約。全モジュールで遵守する。仕様書 `docs/spec.md` と共に正典。

## 1. 命名規約

### 1.1 言語要素
| 対象 | スタイル | 例 |
|------|---------|-----|
| 変数・関数 | camelCase | `currentScore`, `computeScore()` |
| 型・インターフェース | PascalCase | `DifficultyProfile`, `GameResult` |
| 列挙的文字列リテラル型 | snake-case 文字列 + PascalCase 型 | `type Tier = 'easy' \| 'normal' \| 'hard'` |
| React コンポーネント | PascalCase | `GameScreen`, `PendulumCanvas` |
| React フック | `use` プレフィックス + camelCase | `useGameLoop`, `useHighScores` |
| 定数（モジュール定数） | SCREAMING_SNAKE_CASE | `TOTAL_SECONDS`, `SIGMA_FACTOR_TIP` |
| プライベート補助関数（同ファイル内のみ使用） | camelCase（接頭辞なし） | `derivN`, `rk4Step` |

### 1.2 ファイル名
| 対象 | スタイル | 例 |
|------|---------|-----|
| React コンポーネント | PascalCase + `.tsx` | `GameScreen.tsx` |
| React フック | camelCase + `.ts` | `useGameLoop.ts` |
| ライブラリ・ユーティリティ | camelCase + `.ts` | `scoring.ts`, `physics.ts` |
| 共通型 | `types.ts` | `src/types.ts` |
| 定数 | `constants.ts` | `src/constants.ts` |
| 型のみのドメインモジュール | `*.types.ts` を許容 | （任意） |
| エントリ | `main.tsx` | Vite 既定 |

### 1.3 ディレクトリ名
- すべて kebab-case または小文字 1 単語
- 例：`src/lib`, `src/components`, `src/screens`

## 2. ディレクトリ構成（推奨）
```
src/
  main.tsx               # エントリ
  App.tsx                # 画面ルーティングのルート
  index.css              # グローバルスタイル
  types.ts               # 共通型
  constants.ts           # 共通定数
  lib/
    physics.ts           # M1: 物理（純関数）
    scoring.ts           # M3: スコアリング（純関数）
    chaos.ts             # M7 内: カオス保証（純関数）
    storage.ts           # M9: localStorage
    share.ts             # M10: 共有
    canvasShot.ts        # M10: PNG 化
  components/
    PendulumCanvas.tsx   # M2: 描画コア
    HUD.tsx              # M5
    PauseOverlay.tsx     # M5
    CountdownOverlay.tsx # M5
    AimMarker.tsx        # M5
    DifficultyCard.tsx   # M6
    PrecisionMeter.tsx   # M5
    TimeBar.tsx          # M5
    AngleDial.tsx        # M8
    CustomSlider.tsx     # M8
    PreviewPendulum.tsx  # M8（ドラッグ可能プレビュー）
  screens/
    TitleScreen.tsx
    ModeScreen.tsx
    DifficultyScreen.tsx
    CustomScreen.tsx
    GameScreen.tsx
    ResultScreen.tsx
  hooks/
    useGameLoop.ts
    useCountdown.ts
    useHighScores.ts
  styles/
    title.css
    game.css
    （画面/コンポーネント単位で .css または CSS Modules）
```

## 3. import / export

### 3.1 export 方式
- **コンポーネント**：`export default function ComponentName()` を許容（Vite/React 慣習）
- **ライブラリ・ユーティリティ・型**：必ず named export
  - 例：`export function computeScore(...)`, `export type DifficultyProfile = ...`
- **定数**：named export

### 3.2 import 方式
- 相対パス（`./`, `../`）または `@/` エイリアス（必要に応じて `vite.config.ts` で追加）
- 1 ファイルに 1 トピック。再エクスポートのバレル（`index.ts`）は使わない
- 型のみ import は `import type { ... } from '...'` を使用

## 4. コメント・ドキュメンテーション

### 4.1 既定はコメントなし
- well-named 識別子で意図が伝わるなら書かない
- 必要なときのみ：非自明な制約、隠れた不変条件、回避策、驚きうる挙動

### 4.2 ファイル冒頭の役割コメント（任意）
- 必要なら 1〜2 行で「このファイルの責務」を書く
- 例：`// pendulum-physics.ts — n振り子の運動方程式と RK4 積分（純関数）`

### 4.3 公開 API 関数の JSDoc（必要時）
- 公開関数で引数の単位や戻り値の形が非自明な場合のみ JSDoc を書く
- 単位（rad / deg、px / 物理単位）は明示する

## 5. エラーハンドリング

### 5.1 基本方針
- **内部関数**：契約違反は `throw new Error(...)` で例外を投げる（callee を信頼する）
- **外部入力（localStorage、ユーザー入力）**：try/catch で防御し、安全な既定値にフォールバック
- **無効な状態を表現可能にしない**（型でガードする）

### 5.2 localStorage
- 読み込み：try/catch、JSON.parse の失敗は `{}` で初期化
- 書き込み：try/catch、失敗は無視（QuotaExceeded 等）

### 5.3 物理シミュレーション
- 初期角度の範囲外検証は実装側で必要なら行う（今回は仕様で規定された範囲のみ受け取る前提）
- 数値破綻（NaN）が出た場合は即時 throw でデバッグしやすくする（実装段階で検討）

## 6. TypeScript 設定方針
- Vite テンプレ既定の strict 設定をそのまま使う
- `any` は使わない。やむを得ず使うときは `// TODO` ではなく理由コメント必須
- 列挙は string union（enum を新設しない）

## 7. テスト方針（モジュール 0 では仕組みは入れない）
- 物理・スコアリングは純関数であるため、後続モジュールで必要になったタイミングで `vitest` 等を導入する選択肢を残す
- 本仕様では自動テスト追加は範囲外（部分監査・全体監査で代替）

## 8. CSS / スタイリング
- グローバルは最小限（`index.css`）
- 画面・コンポーネント単位の CSS は `.css` ファイル分離 or CSS Modules（`*.module.css`）。実装段階で確定
- カラー・フォントなどは CSS 変数（`--accent` 等）で集約する

## 9. 依存ライブラリ追加ルール
- spec.md「6. 技術スタック」と「変更禁止」原則に従う
- ライブラリ追加は明示的な許可をユーザーから得てから

## 10. コミット運用（参考）
- コミットは dev-guide / 部分監査 / 全体監査の節目で行う
- メッセージは英語短文 or 日本語短文どちらでも可（プロジェクト初期は緩く運用）
