# Raycast Quick Translate Extension

## プロジェクト概要

Raycastで選択したテキストを日本語に翻訳するRaycast拡張機能です。将来的にはスクリーンショットからOCRで文字を抽出して翻訳する機能も追加予定です。

## 技術スタック

- **Raycast API**: macOS用ランチャーの拡張機能API
- **TypeScript**: 型安全な開発
- **React**: UI構築
- **Google Gemini API**: テキスト翻訳に使用（gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite）
- **Tesseract.js**: スクリーンショット翻訳用OCRライブラリ（ローカル処理、無料）※Phase 2で実装予定

## 主な機能

### Phase 1: テキスト翻訳（✅ 実装済み）

1. **選択テキストの翻訳**
   - 選択されたテキストをGemini APIで日本語に翻訳
   - クリップボードのテキストも翻訳可能（フォールバック機能）
   - 翻訳結果をRaycast UIに表示
   - 翻訳結果をクリップボードにコピー/ペースト
   - キーボードショートカット対応

2. **Geminiモデル選択機能**
   - UIから使用するGeminiモデルを選択可能
   - 対応モデル：
     - **Gemini 2.5 Pro** - 高精度・複雑なタスク向け
     - **Gemini 2.5 Flash** - 高速でバランスが良い
     - **Gemini 2.5 Flash Lite** - （デフォルト）最軽量・最速

3. **包括的なエラーハンドリング**
   - API Key検証（"AI"プレフィックス必須）
   - 入力長チェック（最大10,000文字）
   - 詳細なエラーメッセージと解決策の提示
   - ネットワークエラー、クォータ超過などの適切な処理

### Phase 2: スクリーンショット翻訳（⬜ 実装予定）

1. **OCR機能**
   - スクリーンショットを撮影
   - Tesseract.jsでテキスト抽出
   - 抽出したテキストをGemini APIで日本語に翻訳

## 開発環境のセットアップ

### 必要な環境

- macOS
- Raycast 1.26.0以上
- Node.js 22.14以上
- npm 7以上
- Gemini API Key

### 初期セットアップ

```bash
# 依存関係のインストール
npm install

# 開発モード（ホットリロード）
npm run dev

# ビルド
npm run build
```

### Gemini API Keyの設定

1. [Google AI Studio](https://makersuite.google.com/app/apikey)でAPI Keyを取得
2. Raycastの拡張機能設定でAPI Keyを入力

## プロジェクト構造

```
raycast-quick-translate-extension/
├── assets/
│   └── icon.png              # 拡張機能のアイコン
├── src/
│   ├── translate-text.tsx    # テキスト翻訳コマンド
│   ├── translate-screenshot.tsx  # スクリーンショット翻訳（予定）
│   └── utils/
│       ├── gemini.ts         # Gemini API統合
│       └── ocr.ts            # OCR処理（予定）
├── package.json              # マニフェストと依存関係
├── tsconfig.json             # TypeScript設定
├── CLAUDE.md                 # このファイル
└── RAYCAST_EXTENSION_GUIDE.md  # 開発ガイド
```

## 開発の進め方

### Phase 1: テキスト翻訳機能（✅ 完了）

1. ✅ プロジェクト構造の作成
2. ✅ Gemini APIクライアントの実装
3. ✅ 選択テキスト取得機能
4. ✅ 翻訳UIの実装
5. ✅ エラーハンドリング
6. ✅ モデル選択機能
7. ✅ JSDocドキュメント
8. ⬜ ユニットテスト（今後追加）

### Phase 2: スクリーンショット翻訳機能

1. ⬜ スクリーンショット撮影機能
2. ⬜ Tesseract.jsの統合
3. ⬜ OCRでテキスト抽出
4. ⬜ Gemini APIで翻訳処理
5. ⬜ UIの改善

## Raycast API の主要な使用箇所

### テキスト取得

```typescript
import { getSelectedText } from "@raycast/api";

// 選択されたテキストを取得
const selectedText = await getSelectedText();
```

### クリップボード操作

```typescript
import { Clipboard } from "@raycast/api";

// クリップボードから読み取り
const text = await Clipboard.readText();

// クリップボードにコピー
await Clipboard.copy(translatedText);
```

### UI表示

```typescript
import { Detail } from "@raycast/api";

// Markdown形式で結果を表示
<Detail
  markdown={`# 翻訳結果\n\n${translatedText}`}
  actions={
    <ActionPanel>
      <Action.CopyToClipboard content={translatedText} />
    </ActionPanel>
  }
/>
```

## Gemini API 統合

### API呼び出し例

実装済みのコードは`src/utils/gemini.ts`を参照してください。

```typescript
import { translateToJapanese } from "./utils/gemini";

// 基本的な使い方
const translatedText = await translateToJapanese(
  "Hello world",
  apiKey,
  "gemini-2.5-flash"
);

// エラーハンドリング付き
try {
  const result = await translateToJapanese(text, apiKey, modelName);
  console.log(result); // "こんにちは世界"
} catch (error) {
  console.error("Translation failed:", error.message);
}
```

### 対応Geminiモデル（実装済み）

UIから以下のモデルを選択可能：

```typescript
// 利用可能なモデル:
// - gemini-2.5-pro        - 高精度、複雑なタスク向け
// - gemini-2.5-flash      - 高速でバランスが良い
// - gemini-2.5-flash-lite (デフォルト) - 最軽量・最速

// Preferencesから選択したモデルを取得
const preferences = getPreferenceValues<Preferences>();
const modelName = preferences.geminiModel; // ユーザーが選択したモデル
```

### 実装の特徴

- ✅ API Key検証（"AI"プレフィックス必須）
- ✅ 入力長制限（最大10,000文字）
- ✅ 包括的なエラーハンドリング
- ✅ 型安全なTypeScript実装
- ✅ JSDocドキュメント完備

### OCR処理（Phase 2）

スクリーンショットからのテキスト抽出には、Tesseract.jsを使用：

```typescript
import Tesseract from 'tesseract.js';

// 画像からテキストを抽出
const { data: { text } } = await Tesseract.recognize(
  imageBuffer,
  'eng+jpn',  // 英語と日本語をサポート
  {
    logger: (m) => console.log(m), // 進捗状況をログ出力（オプション）
  }
);

// 抽出したテキストをGemini APIで翻訳
const translatedText = await translateWithGemini(text, apiKey);
```

## トラブルシューティング

### よくある問題

1. **API Key エラー**
   - Gemini API Keyが正しく設定されているか確認
   - API Keyの権限を確認

2. **選択テキストが取得できない**
   - Raycastにアクセシビリティ権限が付与されているか確認
   - システム環境設定 > セキュリティとプライバシー > アクセシビリティ

3. **ビルドエラー**
   - `npm install`で依存関係を再インストール
   - Node.jsのバージョンを確認

## 参考リンク

- [Raycast Developers](https://developers.raycast.com/)
- [Raycast API Reference](https://developers.raycast.com/api-reference)
- [Google Gemini API](https://ai.google.dev/)
- [Qiita: Raycast拡張機能の作り方](https://qiita.com/kentosity/items/fb7ab9314a69c0f534d1)

## ライセンス

MIT

## 作成者

[Your Name]
