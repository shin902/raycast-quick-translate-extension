# Raycast Quick Translate Extension

## プロジェクト概要

Raycastで選択したテキストを日本語に翻訳するRaycast拡張機能です。将来的にはスクリーンショットからOCRで文字を抽出して翻訳する機能も追加予定です。

## 技術スタック

- **Raycast API**: macOS用ランチャーの拡張機能API
- **TypeScript**: 型安全な開発
- **React**: UI構築
- **Google Gemini API**: テキスト翻訳に使用（gemini-2.5-pro）
- **OCRライブラリ**: スクリーンショット翻訳用（Tesseract.js、Cloud Vision API等を検討）

## 主な機能

### 実装予定機能

1. **テキスト翻訳** (Phase 1)
   - 選択されたテキストをGemini API（gemini-2.5-pro）で日本語に翻訳
   - クリップボードのテキストも翻訳可能
   - 翻訳結果をRaycast UIに表示
   - 翻訳結果をクリップボードにコピー
   - UIからGeminiモデルを簡単に変更可能（将来的な機能）

2. **スクリーンショット翻訳** (Phase 2)
   - スクリーンショットを撮影
   - OCRライブラリ（Tesseract.js、Cloud Vision API等）でテキスト抽出
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

### Phase 1: テキスト翻訳機能

1. ✅ プロジェクト構造の作成
2. ⬜ Gemini APIクライアントの実装
3. ⬜ 選択テキスト取得機能
4. ⬜ 翻訳UIの実装
5. ⬜ エラーハンドリング
6. ⬜ テスト

### Phase 2: スクリーンショット翻訳機能

1. ⬜ スクリーンショット撮影機能
2. ⬜ OCRライブラリの選定と統合
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

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// テキスト翻訳
const prompt = `以下のテキストを日本語に翻訳してください：\n\n${text}`;
const result = await model.generateContent(prompt);
const translation = result.response.text();
```

### モデル選択機能（将来的な実装）

UIからモデルを動的に選択できるようにする予定：

```typescript
// Preferencesまたはドロップダウンから選択
const modelName = preferences.geminiModel || "gemini-2.5-pro";
const model = genAI.getGenerativeModel({ model: modelName });

// 利用可能なモデル例:
// - gemini-2.5-pro
// - gemini-2.5-flash
// - gemini-1.5-pro
// - gemini-1.5-flash
```

### OCR処理（Phase 2）

スクリーンショットからのテキスト抽出には、Geminiではなく専用のOCRライブラリを使用：

```typescript
// オプション1: Tesseract.js（ローカル処理、無料）
import Tesseract from 'tesseract.js';

const { data: { text } } = await Tesseract.recognize(
  imageBuffer,
  'eng+jpn',  // 英語と日本語をサポート
);

// オプション2: Cloud Vision API（高精度、有料）
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();
const [result] = await client.textDetection(imageBuffer);
const text = result.fullTextAnnotation?.text;
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
