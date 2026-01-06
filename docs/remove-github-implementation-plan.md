# GitHub機能削除 実装計画書

## 概要

設定画面およびコードベース全体からGitHub連携機能を完全に削除する。

## 目的

- 要件定義に沿ったシンプルな学習管理アプリにする
- GitHub連携は実装しない方針を明確化
- 外部サービス依存を排除し、学習管理に集中する

## 影響範囲

### 1. ドキュメント

#### [docs/requirements.md](./requirements.md)
- ✅ **完了**: 設定画面のセクションにGitHub機能は実装しない旨を明記

#### [docs/data-model.md](./data-model.md)
- **変更内容**: Userエンティティ内のGitHub関連フィールドを削除
- **対象フィールド**:
  - `github_username`
  - `github_token`
  - `github_repo`
- **変更箇所**:
  - TypeScript型定義（15-30行目）
  - フィールド詳細テーブル（35-43行目）
  - ERD図（316-324行目）
  - SQL定義（473-480行目）

### 2. 型定義

#### [types/index.ts](../types/index.ts)
- **変更内容**: GitHub関連の型を削除
- **削除対象**:
  - `UserSettings`インターフェース内の以下フィールド:
    - `githubUsername?: string;` (25行目)
    - `githubToken?: string;` (26行目)
    - `githubRepo?: string;` (27行目)
  - `GitHubCommit`インターフェース全体（100-107行目）

### 3. データベースアクセス層

#### [lib/db.ts](../lib/db.ts)
- **変更内容**: GitHub関連の関数を削除
- **削除対象**:
  - `getGitHubCommits()` 関数（234-240行目）
  - `fetchGitHubCommits()` 関数（242-248行目）
- **型インポート**: `GitHubCommit`のインポートを削除（18行目）

### 4. モックデータ

#### [lib/mockData.ts](../lib/mockData.ts)
- **確認が必要**: このファイルにGitHub関連のモックデータが含まれているか確認
- **削除対象**（存在する場合）:
  - `githubCommits` データ
  - `UserSettings`内のGitHub関連フィールド

### 5. フロントエンド画面

#### [app/settings/page.tsx](../app/settings/page.tsx)
- **変更内容**: GitHub設定セクション全体を削除
- **削除対象**:
  - stateの削除:
    - `githubRepo` (13行目)
    - `githubToken` (14行目)
  - useEffect内のGitHub設定読み込み処理（23-24行目）
  - handleSave内のGitHub設定保存処理（38-41行目）
  - GitHub設定セクション全体のUI（64-117行目）
- **残すもの**:
  - ルール確認セクション（119-145行目）

### 6. その他の画面

#### ホーム画面（[app/page.tsx](../app/page.tsx)）など
- **確認が必要**: GitHubコミット情報を表示している箇所がないか確認
- **削除対象**（存在する場合）:
  - GitHubコミット一覧表示
  - GitHub関連のコンポーネント

## 実装手順

### Phase 1: ドキュメント更新
1. ✅ [docs/requirements.md](./requirements.md) - GitHub機能不実装を明記（完了）
2. [docs/data-model.md](./data-model.md) - GitHub関連フィールドを削除

### Phase 2: 型定義の更新
3. [types/index.ts](../types/index.ts) - GitHub関連の型を削除

### Phase 3: データ層の更新
4. [lib/mockData.ts](../lib/mockData.ts) - GitHub関連のモックデータを削除（確認後）
5. [lib/db.ts](../lib/db.ts) - GitHub関連の関数を削除

### Phase 4: UI層の更新
6. [app/settings/page.tsx](../app/settings/page.tsx) - GitHub設定セクションを削除
7. その他の画面 - GitHub表示があれば削除（確認後）

### Phase 5: 動作確認
8. 設定画面が正常に表示されることを確認
9. ルール確認セクションのみが表示されることを確認
10. ビルドエラーがないことを確認

## 注意事項

- **データベースの実テーブルが存在する場合**: マイグレーションスクリプトが必要
  - `user_settings`テーブルの`github_username`, `github_token`, `github_repo`カラムを削除
  - 現在はモック実装のため、実テーブルは存在しない想定
- **既存データの扱い**: モック実装のため影響なし
- **将来的な復活**: 完全削除するため、復活させる場合はgit履歴から復元が必要

## チェックリスト

- [x] docs/data-model.md の更新
- [x] types/index.ts の更新
- [x] lib/mockData.ts の確認と更新
- [x] lib/db.ts の更新
- [x] app/settings/page.tsx の更新
- [x] その他画面の確認
- [x] GitHub関連コードの完全削除を確認

## 実装完了

すべてのGitHub関連機能が正常に削除されました。

### 削除した内容

1. **ドキュメント**
   - [docs/data-model.md](./data-model.md): Userエンティティからgithub_username, github_token, github_repoフィールドを削除
   - [docs/requirements.md](./requirements.md): 設定画面セクションにGitHub機能不実装を明記

2. **型定義**
   - [types/index.ts](../types/index.ts):
     - `UserSettings`インターフェースからGitHubフィールドを削除
     - `GitHubCommit`インターフェースを完全削除

3. **データ層**
   - [lib/mockData.ts](../lib/mockData.ts):
     - `mockUserSettings`からGitHubフィールドを削除
     - `mockGitHubCommits`配列を完全削除
     - `GitHubCommit`型のインポートを削除
   - [lib/db.ts](../lib/db.ts):
     - `getGitHubCommits()`関数を削除
     - `fetchGitHubCommits()`関数を削除
     - `GitHubCommit`型のインポートを削除

4. **UI層**
   - [app/settings/page.tsx](../app/settings/page.tsx):
     - GitHub設定セクション全体を削除（64-117行目）
     - GitHub関連のstate（githubRepo, githubToken）を削除
     - GitHub関連の保存処理（handleSave）を削除
     - 不要なインポート（useState, useEffect, getUserSettings, updateUserSettings, UserSettings）を削除

### 確認結果

- ✅ すべてのTSX/TSファイルからGitHub機能コードが削除されました
- ✅ 学習内容テキスト内の「GitHub」という単語は残っていますが、これは問題ありません
- ⚠️ ビルドエラーが1件ありますが、これはGitHub削除とは無関係の既存問題です（app/day/[date]/page.tsx:127 - stepUpStrategyプロパティの型エラー）

### 残存する"GitHub"の文字列

以下の箇所には「GitHub」という単語が残っていますが、これらは学習内容のテキストであり、機能的なコードではないため問題ありません：

- [lib/mockData.ts](../lib/mockData.ts:251) - 学習内容: "GitHubのプルリクエスト作成\nコードレビューの基本を学習"
