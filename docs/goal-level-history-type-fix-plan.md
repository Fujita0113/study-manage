# 型定義整理 & goal_level_history テーブル追加 修正計画

## エラー概要

### 発生しているエラー
```
Type error: No overload matches this call.
Argument of type '"goal_level_history"' is not assignable to parameter of type '"goals" | "daily_records" | ...
```

### 原因
`app/api/history/level-history/route.ts` で `supabase.from('goal_level_history')` を呼び出しているが、型定義に `goal_level_history` テーブルが存在しない。

---

## 調査結果

### 型定義ファイルの状況

| ファイル | 役割 | 状態 |
|---------|------|------|
| `lib/supabase/types.ts` | Supabase CLI生成の型定義 | **メインで使用中** |
| `types/database.ts` | 古い手動型定義 | **`lib/actions.ts`のみ使用（デッドコード）** |

### コードの使用状況

| ファイル | 状態 | 理由 |
|---------|------|------|
| `lib/db.ts` | **使用中** | `@/lib/supabase/types` を使用、`goal_history_slots` を参照 |
| `lib/actions.ts` | **デッドコード** | `@/types/database` を使用、どこからもインポートされていない |

### テーブルの状況

| テーブル名 | DBに存在 | 使用箇所 |
|-----------|---------|---------|
| `goal_history_slots` | **あり** | `lib/db.ts` で使用中 |
| `goal_history` | **なし** | `lib/actions.ts`（デッドコード）のみ |
| `goal_level_history` | **あり**（マイグレーション済み） | `app/api/history/level-history/route.ts` |
| `streaks` | **なし**（ドロップ済み） | 型定義に残っているが未使用 |

---

## 使用モジュールとバージョン

| モジュール | バージョン | 備考 |
|-----------|-----------|------|
| @supabase/supabase-js | ^2.90.1 | Supabaseクライアント |
| supabase (CLI) | ^2.72.4 | 型生成に使用 |
| typescript | ^5 | 型チェック |

---

## 修正方針

### 削除するもの
1. `lib/actions.ts` - デッドコード（どこからも使用されていない）
2. `types/database.ts` - 古い型定義（`lib/actions.ts` のみが使用）

### 更新するもの
1. `lib/supabase/types.ts` に以下を追加:
   - `goal_level_history` テーブルの型定義
   - `streaks` テーブルの型定義を削除（DBからドロップ済み）

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `lib/actions.ts` | **削除** |
| `types/database.ts` | **削除** |
| `lib/supabase/types.ts` | `goal_level_history` 追加、`streaks` 削除 |

---

## 実装手順

### ステップ1: lib/actions.ts を削除

デッドコードのため削除。

### ステップ2: types/database.ts を削除

`lib/actions.ts` のみが使用していたため削除。

### ステップ3: lib/supabase/types.ts を更新

#### 3-1: streaks テーブルの型定義を削除

DBからドロップ済みのため削除。

#### 3-2: goal_level_history テーブルの型定義を追加

マイグレーションファイルに基づいて以下を追加:

```typescript
goal_level_history: {
  Row: {
    id: string
    user_id: string
    goal_type: string
    level: number
    goal_content: string
    started_at: string
    ended_at: string | null
    change_reason: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    goal_type: string
    level: number
    goal_content: string
    started_at: string
    ended_at?: string | null
    change_reason: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    goal_type?: string
    level?: number
    goal_content?: string
    started_at?: string
    ended_at?: string | null
    change_reason?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}
```

### ステップ4: ビルド確認

```bash
npm run build
```

---

## 想定される影響範囲

- `lib/actions.ts` 削除: 影響なし（デッドコード）
- `types/database.ts` 削除: 影響なし（`lib/actions.ts` のみが使用）
- `lib/supabase/types.ts` 更新: `goal_level_history` が使用可能になる

---

## テスト方針

1. `npm run build` が成功することを確認
2. `/api/history/level-history` エンドポイントが正常に動作することを確認
3. 既存の機能（目標設定、記録など）が正常に動作することを確認
