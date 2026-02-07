# リカバリーモード実装計画

## 作業の目的と概要

「今日はBronzeの達成も無理だ」と感じた時に起動するリカバリーモードを実装します。このモードにより、調子が悪い日でもストリークを維持し、不調が長引かないようにする回復支援機能を提供します。

---

## 使用する主要モジュールとバージョン

| モジュール | バージョン | 用途 |
|-----------|-----------|------|
| Next.js | 16.1.1 | App Router使用 |
| React | 19.2.3 | UIコンポーネント |
| @supabase/supabase-js | ^2.90.1 | DB操作 |
| @supabase/ssr | ^0.8.0 | Server Component用Supabase |
| date-fns | ^4.1.0 | 日付操作 |
| lucide-react | ^0.562.0 | アイコン |

### 依存関係で注意すべき点

- Next.js 16.x + React 19.x の組み合わせ（最新版）
- Server ComponentとClient Componentの境界を明確にする必要あり
- `lib/db.ts`はServer Component専用（Client ComponentからはAPI Routes経由でアクセス）

---

## 変更が必要なファイルのリスト

### 1. データベース（マイグレーション）

| ファイル | 変更内容 |
|---------|----------|
| `supabase/migrations/YYYYMMDD_add_recovery_mode.sql` | 新規作成：Recovery関連テーブル・カラム追加 |

### 2. バックエンド（DB関数・API）

| ファイル | 変更内容 |
|---------|----------|
| `lib/db.ts` | Recovery関連のDB関数を追加 |
| `types/index.ts` | Recovery関連の型定義を追加 |
| `app/api/recovery-goal/route.ts` | 新規作成：Recovery目標のCRUD |
| `app/api/recovery-mode/route.ts` | 新規作成：Recoveryモード起動・状態確認・終了 |
| `app/api/goals/initial/route.ts` | 修正：初期目標設定時にRecovery目標も保存 |
| `app/api/daily-records/route.ts` | 修正：Recovery達成フラグを保存 |

### 3. フロントエンド（UI）

| ファイル | 変更内容 |
|---------|----------|
| `components/layout/Header.tsx` | リカバリーボタン追加 |
| `components/layout/AppLayout.tsx` | リカバリーモードバナー追加 |
| `components/recovery/RecoveryConfirmDialog.tsx` | 新規作成：起動確認ダイアログ |
| `components/recovery/RecoveryModeBanner.tsx` | 新規作成：モード中バナー |
| `app/onboarding/page.tsx` | リカバリー目標入力フィールド追加 |
| `app/record/RecordPageClient.tsx` | Recoveryセクション追加 |
| `app/settings/SettingsPageClient.tsx` | リカバリー目標編集セクション追加 |
| `app/calendar/page.tsx` | リカバリーマーク表示・凡例追加 |
| `app/day/[date]/page.tsx` | Recovery達成情報表示 |
| `app/page.tsx` | リカバリーモード状態をAppLayoutに渡す |

---

## 各ファイルでの具体的な変更内容

### Phase 1: データベース拡張

#### 1.1 マイグレーション作成

**新規ファイル**: `supabase/migrations/YYYYMMDD_add_recovery_mode.sql`

```sql
-- 1. user_settings テーブルにRecovery関連カラムを追加
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS recovery_goal TEXT,
ADD COLUMN IF NOT EXISTS recovery_mode_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recovery_mode_activated_date DATE;

-- 2. daily_records テーブルにRecovery達成フラグを追加
ALTER TABLE daily_records
ADD COLUMN IF NOT EXISTS recovery_achieved BOOLEAN DEFAULT FALSE;

-- 3. goal_history_slots テーブルにRecovery目標を追加
ALTER TABLE goal_history_slots
ADD COLUMN IF NOT EXISTS recovery_goal TEXT;
```

### Phase 2: 型定義・DB関数追加

#### 2.1 型定義更新

**ファイル**: `types/index.ts`

追加する型:
```typescript
// UserSettings型を拡張
interface UserSettings {
  // 既存フィールド...
  recoveryGoal?: string;
  recoveryModeActive?: boolean;
  recoveryModeActivatedDate?: string;
}

// DailyRecord型を拡張
interface DailyRecord {
  // 既存フィールド...
  recoveryAchieved?: boolean;
}
```

#### 2.2 DB関数追加

**ファイル**: `lib/db.ts`

追加する関数:
```typescript
// リカバリー目標取得
export async function getRecoveryGoal(userId: string): Promise<string | null>

// リカバリー目標更新
export async function updateRecoveryGoal(userId: string, goal: string): Promise<void>

// リカバリーモード起動
export async function activateRecoveryMode(userId: string): Promise<void>

// リカバリーモード状態取得
export async function getRecoveryModeStatus(userId: string): Promise<{
  isActive: boolean;
  goal: string | null;
  activatedDate: string | null;
}>

// リカバリーモード解除
export async function deactivateRecoveryMode(userId: string): Promise<void>

// 日報作成時のRecovery達成保存（既存関数を修正）
export async function createDailyRecord(
  recordData: DailyRecordInput & { recoveryAchieved?: boolean },
  userId: string
): Promise<DailyRecord>
```

### Phase 3: API Routes作成

#### 3.1 Recovery目標API

**新規ファイル**: `app/api/recovery-goal/route.ts`

```typescript
// GET: Recovery目標取得
// PATCH: Recovery目標更新
```

#### 3.2 Recoveryモード管理API

**新規ファイル**: `app/api/recovery-mode/route.ts`

```typescript
// GET: 現在の状態取得
// POST: モード起動
// DELETE: モード解除
```

#### 3.3 既存API修正

**ファイル**: `app/api/goals/initial/route.ts`
- Recovery目標も同時に保存するよう修正

**ファイル**: `app/api/daily-records/route.ts`
- `recoveryAchieved` フラグを受け取って保存

### Phase 4: UIコンポーネント実装

#### 4.1 リカバリーボタン（ヘッダー）

**ファイル**: `components/layout/Header.tsx`

変更内容:
- 「記録」ボタンの横に「リカバリー」ボタンを追加
- Props追加: `recoveryModeStatus`, `onRecoveryClick`, `canShowRecoveryButton`
- 表示条件: 当日の記録が未確定かつリカバリーモード未起動時

#### 4.2 起動確認ダイアログ

**新規ファイル**: `components/recovery/RecoveryConfirmDialog.tsx`

機能:
- モーダルダイアログ形式
- タイトル: 「リカバリーモードを起動しますか？」
- 内容: Recovery目標の表示 + 注意事項
- ボタン: 「起動する」「やめる」

#### 4.3 リカバリーモードバナー

**新規ファイル**: `components/recovery/RecoveryModeBanner.tsx`

機能:
- 画面上部に固定表示（控えめなスタイル）
- 内容: 「リカバリーモード中：[目標]」
- 記録画面へのリンク

#### 4.4 初期目標設定画面

**ファイル**: `app/onboarding/page.tsx`

変更内容:
- Gold目標の下にリカバリー目標入力フィールド追加
- バリデーション: 1文字以上必須
- 保存処理にRecovery目標を含める

#### 4.5 記録画面

**ファイル**: `app/record/RecordPageClient.tsx`

変更内容:
- Recoveryセクションを最上部に追加（リカバリーモード中のみ表示）
- 達成レベル判定ロジック修正（Recovery + 通常レベル両立）
- 記録ボタン有効条件修正（Recovery達成でも有効）
- 保存処理に `recoveryAchieved` フラグ追加
- 達成時の特別な褒め文言表示

#### 4.6 設定画面

**ファイル**: `app/settings/SettingsPageClient.tsx`

変更内容:
- リカバリー目標編集セクションを追加（最上部）
- テキスト入力 + 保存ボタン
- リカバリーモード中はグレーアウト（disabled）

#### 4.7 カレンダー画面

**ファイル**: `app/calendar/page.tsx`

変更内容:
- Recovery達成日に♥️マークを表示
- 凡例に「♥️マークはリカバリーモードで達成した日」を追加

#### 4.8 日詳細画面

**ファイル**: `app/day/[date]/page.tsx`

変更内容:
- Recovery達成情報を表示（♥️マーク付き）
- Recoveryセクションをカテゴリに追加

### Phase 5: ホーム画面統合

**ファイル**: `app/page.tsx`

変更内容:
- リカバリーモード状態を取得
- AppLayoutにRecovery情報を渡す

**ファイル**: `components/layout/AppLayout.tsx`

変更内容:
- RecoveryModeBannerをレンダリング（モード中のみ）
- 起動確認ダイアログの表示制御

---

## 実装手順（ステップバイステップ）

### Step 1: マイグレーション作成・適用
1. `supabase/migrations/` に新規マイグレーションファイル作成
2. `npx supabase db push` でDBに適用

### Step 2: 型定義・DB関数追加
1. `types/index.ts` に型定義追加
2. `lib/db.ts` にRecovery関連関数追加

### Step 3: API Routes作成
1. `/api/recovery-goal/route.ts` 作成
2. `/api/recovery-mode/route.ts` 作成
3. 既存APIの修正（goals/initial, daily-records）

### Step 4: 初期目標設定画面修正
1. リカバリー目標入力フィールド追加
2. バリデーション・保存処理修正

### Step 5: 設定画面修正
1. リカバリー目標編集セクション追加
2. API連携実装

### Step 6: ヘッダー・ダイアログ実装
1. RecoveryConfirmDialogコンポーネント作成
2. Headerにリカバリーボタン追加
3. AppLayoutにバナー追加

### Step 7: 記録画面修正
1. Recoveryセクション追加
2. 達成レベル判定ロジック修正
3. 保存処理修正
4. 特別な褒め文言表示

### Step 8: カレンダー・履歴画面修正
1. Recovery達成日に♥️マーク表示
2. 凡例にRecovery説明追加
3. 日詳細画面にRecovery情報表示

### Step 9: ホーム画面統合
1. リカバリーモード状態取得
2. AppLayoutへのデータ連携

---

## 想定される影響範囲

### データベース
- `user_settings` テーブル: 3カラム追加
- `daily_records` テーブル: 1カラム追加
- `goal_history_slots` テーブル: 1カラム追加

### 既存機能への影響
- 日報記録: Recovery達成フラグの追加（既存機能は影響なし）
- ストリーク計算: Recovery達成でもカウント対象（既存ロジックは維持）
- 初期目標設定: Recovery目標が必須項目に追加

### パフォーマンス
- DBクエリ: Recovery状態取得のためのクエリが増加（軽微）
- ページ読み込み: 追加データ取得による影響は軽微

---

## テスト方針

### 単体テスト
1. DB関数のテスト（Recovery目標CRUD、モード起動/解除）
2. 達成レベル判定ロジックのテスト

### 統合テスト
1. 初期目標設定フロー（Recovery目標含む）
2. リカバリーモード起動フロー
3. 記録画面でのRecovery達成記録
4. 日付変更時の自動解除

### 手動テスト
1. リカバリーモード起動 → 確認ダイアログ表示 → 起動
2. モード中のUI表示確認（バナー、ヘッダー、記録画面）
3. Recovery達成 + Bronze達成の両立記録
4. カレンダー画面での♥️マーク表示確認
5. 設定画面でのRecovery目標編集（モード中はグレーアウト）
6. 日付変更時の自動解除確認

### 確認コマンド
```bash
# ビルド確認
npm run build

# 開発サーバー起動
npm run dev

# マイグレーション適用
npx supabase db push
```

---

## 実装の優先順位

1. **高優先度（コア機能）**
   - マイグレーション
   - DB関数
   - API Routes
   - 初期目標設定画面
   - 記録画面

2. **中優先度（ユーザー体験）**
   - ヘッダーボタン
   - 起動確認ダイアログ
   - モードバナー
   - 設定画面

3. **低優先度（補助機能）**
   - カレンダー表示
   - 日詳細画面
   - 特別な褒め文言
