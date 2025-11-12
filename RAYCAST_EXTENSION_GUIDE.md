# Raycast拡張機能 開発ガイド

このドキュメントは、Raycast拡張機能の開発方法を解説します。

## 目次

1. [Raycastとは](#raycastとは)
2. [開発環境のセットアップ](#開発環境のセットアップ)
3. [プロジェクト構造](#プロジェクト構造)
4. [基本的な開発の流れ](#基本的な開発の流れ)
5. [Raycast API](#raycast-api)
6. [実装パターン](#実装パターン)
7. [外部APIの統合](#外部apiの統合)
8. [デバッグとテスト](#デバッグとテスト)
9. [公開手順](#公開手順)

---

## Raycastとは

Raycastは、macOS用の強力なランチャーアプリケーションです。Spotlight検索の代替として、より高機能なコマンドパレットとして動作します。

### 主な特徴

- **拡張可能**: TypeScript/Reactで独自の拡張機能を開発可能
- **豊富なエコシステム**: 公式ストアに多数の拡張機能
- **統一されたUI**: 一貫性のあるユーザー体験
- **ホットリロード**: 開発中の即座の反映
- **AIサポート**: Raycast AIとの統合（オプション）

---

## 開発環境のセットアップ

### 必要な環境

1. **Raycast**: バージョン 1.26.0以上
   - [公式サイト](https://raycast.com/)からダウンロード

2. **Node.js**: 22.14以上
   ```bash
   # nvmを使用した推奨インストール方法
   nvm install 22
   nvm use 22
   ```

3. **npm**: 7以上（Node.jsに付属）

4. **開発知識**:
   - TypeScript の基礎
   - React の基礎
   - 非同期プログラミング

### Raycastへのサインイン

拡張機能の開発コマンドを使用するには、Raycastアプリでサインインが必要です。

1. Raycastを起動（⌘ + Space）
2. "Sign In"と入力してサインイン
3. 以下のコマンドが使用可能になります：
   - `Create Extension` - 新規拡張機能の作成
   - `Import Extension` - 既存コードのインポート
   - `Manage Extensions` - 拡張機能の管理

---

## プロジェクト構造

### 最小構成

Raycast拡張機能には最低限以下が必要です：

```
my-extension/
├── package.json      # マニフェストファイル
└── src/
    └── index.tsx     # エントリーポイント
```

### 標準的な構成

実際のプロジェクトは以下のような構造になります：

```
my-extension/
├── .eslintrc.json           # ESLint設定
├── .prettierrc              # Prettier設定
├── assets/
│   ├── icon.png            # 拡張機能のアイコン（必須）
│   └── command-icon.png    # コマンド別アイコン（オプション）
├── node_modules/
├── package-lock.json
├── package.json            # マニフェストと依存関係
├── src/
│   ├── command1.tsx       # コマンド1
│   ├── command2.tsx       # コマンド2
│   └── utils/
│       ├── api.ts         # API関連ユーティリティ
│       └── helpers.ts     # ヘルパー関数
├── tsconfig.json          # TypeScript設定
└── README.md
```

### package.json（マニフェスト）

`package.json`は拡張機能のメタデータと構成を定義します：

```json
{
  "$schema": "https://www.raycast.com/schemas/extension.json",
  "name": "quick-translate",
  "title": "Quick Translate",
  "description": "Translate selected text to Japanese",
  "icon": "icon.png",
  "author": "your-name",
  "categories": ["Productivity"],
  "license": "MIT",
  "commands": [
    {
      "name": "translate-text",
      "title": "Translate to Japanese",
      "description": "Translate selected text to Japanese using Gemini API",
      "mode": "view",
      "preferences": [
        {
          "name": "geminiApiKey",
          "type": "password",
          "required": true,
          "title": "Gemini API Key",
          "description": "Your Google Gemini API key"
        }
      ]
    }
  ],
  "dependencies": {
    "@raycast/api": "^1.83.2",
    "@google/generative-ai": "^0.1.3"
  },
  "devDependencies": {
    "@raycast/eslint-config": "^1.0.11",
    "@types/node": "20.8.10",
    "@types/react": "18.3.3",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "typescript": "^5.4.5"
  },
  "scripts": {
    "build": "ray build -e dist",
    "dev": "ray develop",
    "fix-lint": "ray lint --fix",
    "lint": "ray lint",
    "publish": "npx @raycast/api@latest publish"
  }
}
```

### 重要な設定項目

#### commands

各コマンドの設定：

- `name`: ファイル名（拡張子なし）と一致させる
- `title`: Raycastに表示されるタイトル
- `mode`: コマンドの種類
  - `view`: UIを表示（List, Grid, Detail, Form）
  - `no-view`: バックグラウンド実行
  - `menu-bar`: メニューバー常駐

#### preferences

ユーザーが設定可能な項目：

```typescript
{
  "name": "apiKey",
  "type": "password",     // text, password, checkbox, dropdown
  "required": true,
  "title": "API Key",
  "description": "Description",
  "default": "default value"  // オプション
}
```

---

## 基本的な開発の流れ

### 1. プロジェクトの作成

Raycastで`Create Extension`コマンドを実行：

```bash
# または、CLIツールを使用
npx @raycast/api@latest create my-extension
```

### 2. 開発モードの起動

```bash
npm run dev
```

ホットリロードが有効になり、コードを保存すると自動的に反映されます。

### 3. コマンドの実装

`src/index.tsx`を編集：

```tsx
import { List } from "@raycast/api";

export default function Command() {
  return (
    <List>
      <List.Item title="Hello World" />
    </List>
  );
}
```

### 4. Raycastでテスト

1. Raycastを開く（⌘ + Space）
2. 拡張機能名を入力
3. コマンドを実行

### 5. デバッグ

コンソール出力を確認：

```bash
# Raycastのログを表示
ray develop
```

---

## Raycast API

### 4つの主要UIコンポーネント

#### 1. List - リスト表示

アイテムのリストを表示します。

```tsx
import { List, ActionPanel, Action } from "@raycast/api";

export default function Command() {
  return (
    <List searchBarPlaceholder="Search items...">
      <List.Item
        title="Item 1"
        subtitle="Description"
        icon="📝"
        actions={
          <ActionPanel>
            <Action.CopyToClipboard content="Copied text" />
          </ActionPanel>
        }
      />
    </List>
  );
}
```

**主な機能**:
- 検索フィルタリング（自動）
- アイコン表示
- アクションパネル
- セクション分け

#### 2. Grid - グリッド表示

画像やアイコンをグリッド形式で表示します。

```tsx
import { Grid } from "@raycast/api";

export default function Command() {
  return (
    <Grid columns={4}>
      <Grid.Item
        content="https://example.com/image.png"
        title="Image 1"
      />
    </Grid>
  );
}
```

#### 3. Detail - 詳細表示

Markdown形式で詳細な情報を表示します。

```tsx
import { Detail, ActionPanel, Action } from "@raycast/api";

export default function Command() {
  const markdown = `
# Title

Here is the **detailed** content.

- Item 1
- Item 2
  `;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content="Copy this" />
        </ActionPanel>
      }
    />
  );
}
```

#### 4. Form - フォーム入力

ユーザーからの入力を受け取ります。

```tsx
import { Form, ActionPanel, Action } from "@raycast/api";
import { useState } from "react";

export default function Command() {
  const [text, setText] = useState("");

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Submit"
            onSubmit={(values) => console.log(values)}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="text"
        title="Text"
        value={text}
        onChange={setText}
      />
      <Form.Checkbox id="checkbox" label="Option" />
      <Form.Dropdown id="dropdown" title="Select">
        <Form.Dropdown.Item value="1" title="Option 1" />
      </Form.Dropdown>
    </Form>
  );
}
```

### よく使うAPI

#### 選択テキストの取得

```typescript
import { getSelectedText } from "@raycast/api";

export default async function Command() {
  try {
    const text = await getSelectedText();
    console.log("Selected:", text);
  } catch (error) {
    console.error("No text selected");
  }
}
```

#### クリップボード操作

```typescript
import { Clipboard, showHUD } from "@raycast/api";

// 読み取り
const text = await Clipboard.readText();

// 書き込み
await Clipboard.copy("Copied text");
await showHUD("Copied to clipboard!");

// クリップボード履歴（最大5件）
const previousText = await Clipboard.readText({ offset: 1 });
```

#### 通知とHUD

```typescript
import { showToast, Toast, showHUD } from "@raycast/api";

// トースト通知（詳細）
await showToast({
  style: Toast.Style.Success,  // Success, Failure, Animated
  title: "Success!",
  message: "Operation completed",
});

// HUD（シンプル）
await showHUD("✅ Done!");
```

#### 環境情報

```typescript
import { environment } from "@raycast/api";

// 拡張機能のパス
console.log(environment.assetsPath);
console.log(environment.supportPath);

// Raycastバージョン
console.log(environment.raycastVersion);
```

#### Preferences（設定）

```typescript
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  apiKey: string;
  language: string;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const apiKey = preferences.apiKey;
}
```

---

## 実装パターン

### パターン1: バックグラウンド処理

UIなしで処理を実行し、結果をHUDで表示：

```tsx
import { showHUD, Clipboard, getSelectedText } from "@raycast/api";

export default async function Command() {
  try {
    const text = await getSelectedText();
    const result = await processText(text);
    await Clipboard.copy(result);
    await showHUD("✅ Processed and copied!");
  } catch (error) {
    await showHUD("❌ Error occurred");
  }
}

async function processText(text: string): Promise<string> {
  // 処理ロジック
  return text.toUpperCase();
}
```

### パターン2: 非同期データ読み込み

```tsx
import { List } from "@raycast/api";
import { useEffect, useState } from "react";

export default function Command() {
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchFromAPI();
        setItems(data);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <List isLoading={isLoading}>
      {items.map((item, index) => (
        <List.Item key={index} title={item} />
      ))}
    </List>
  );
}
```

### パターン3: 検索機能付きリスト

```tsx
import { List } from "@raycast/api";
import { useState } from "react";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<string[]>([]);

  // 検索テキストが変更されたときに実行
  useEffect(() => {
    async function search() {
      if (searchText) {
        const results = await searchAPI(searchText);
        setItems(results);
      }
    }
    search();
  }, [searchText]);

  return (
    <List
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search..."
      throttle
    >
      {items.map((item, index) => (
        <List.Item key={index} title={item} />
      ))}
    </List>
  );
}
```

---

## 外部APIの統合

### HTTPリクエスト

Node.jsの標準ライブラリや`node-fetch`を使用：

```typescript
import fetch from "node-fetch";

async function callAPI(query: string): Promise<string> {
  const response = await fetch("https://api.example.com/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ text: query }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}
```

### Google Gemini API の例

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

async function translateWithGemini(
  text: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `以下のテキストを日本語に翻訳してください：\n\n${text}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
```

### エラーハンドリング

```typescript
import { showToast, Toast } from "@raycast/api";

async function safeAPICall() {
  try {
    const result = await callAPI();
    return result;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "API Error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
```

---

## デバッグとテスト

### コンソールログ

```typescript
console.log("Debug:", data);
console.error("Error:", error);
```

ログは開発モード（`npm run dev`）で確認できます。

### React DevTools

Raycastは標準のReact hooksをサポートしているため、通常のReactデバッグ技術が使えます。

### よくあるエラー

#### 1. "Command not found"

- `package.json`の`commands.name`とファイル名が一致しているか確認
- `npm run dev`を再起動

#### 2. "Preferences not found"

```typescript
// preferences が undefined の場合のハンドリング
const preferences = getPreferenceValues<Preferences>();
if (!preferences.apiKey) {
  await showToast({
    style: Toast.Style.Failure,
    title: "API Key required",
    message: "Please set your API key in preferences",
  });
  return;
}
```

#### 3. "Module not found"

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

---

## 公開手順

### 1. 拡張機能を完成させる

- すべての機能が動作することを確認
- README.mdを記述
- アイコンを作成（512x512px推奨）

### 2. ビルド

```bash
npm run build
```

### 3. リントチェック

```bash
npm run lint
npm run fix-lint  # 自動修正
```

### 4. 公開

```bash
npm run publish
```

Raycastチームによるレビュー後、公式ストアに掲載されます。

### 公開前チェックリスト

- [ ] README.mdに使い方を記載
- [ ] LICENSEファイルを追加
- [ ] スクリーンショットを用意
- [ ] すべてのコマンドが動作
- [ ] エラーハンドリングが適切
- [ ] アイコンが設定されている
- [ ] package.jsonのメタデータが完全

---

## ベストプラクティス

### パフォーマンス

1. **遅延読み込み**: 必要なときだけデータを取得
2. **キャッシュ**: 頻繁に使うデータはキャッシュ
3. **スロットリング**: 検索時は`throttle`プロパティを使用

```tsx
<List throttle onSearchTextChange={setSearchText} />
```

### ユーザー体験

1. **ローディング状態**: `isLoading`を適切に設定
2. **エラーメッセージ**: わかりやすいエラー表示
3. **空状態**: データがない場合の表示

```tsx
<List.EmptyView
  title="No results found"
  description="Try a different search term"
/>
```

### セキュリティ

1. **API Keyの保護**: `password`型のpreferenceを使用
2. **入力検証**: ユーザー入力を検証
3. **HTTPS**: APIは必ずHTTPSを使用

---

## 参考リンク

- [Raycast Developers](https://developers.raycast.com/)
- [API Reference](https://developers.raycast.com/api-reference)
- [Examples](https://github.com/raycast/extensions/tree/main/examples)
- [Community Extensions](https://github.com/raycast/extensions)
- [Qiita: Raycast拡張機能の作り方](https://qiita.com/kentosity/items/fb7ab9314a69c0f534d1)

---

## まとめ

Raycast拡張機能の開発は、TypeScriptとReactの知識があれば比較的簡単に始められます。統一されたAPIと豊富なドキュメントにより、生産性の高い開発が可能です。

まずは小さなコマンドから始めて、徐々に機能を追加していくのがおすすめです。公式のサンプルコードも参考にしながら、自分だけの便利な拡張機能を作ってみましょう！
