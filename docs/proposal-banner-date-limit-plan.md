# 提案バナーの当日限り表示機能 実装計画

## 作業の目的と概要

ホーム画面の目標レベルアップ・ダウン提案バナーを「その日限りの表示」にする機能を実装します。

**現状の問題点:**
- 提案条件を満たすと、条件を満たし続けている限り提案バナーが常に表示される
- 日付が変わっても提案バナーが表示されたままになる

**実装後の動作:**
- 条件を達成した当日のみ提案バナーを表示
- 日付が変わったら自動的に非表示になる
- ユーザーが提案を無視（レベル変更しない）しても、再度同じ条件を達成すれば再び提案バナーを表示する

## 主要な使用モジュールとバージョン

以下のモジュールを使用します（`package.json`から確認）：

- **Next.js**: 16.1.1
  - Server Components と Client Components の使い分けが必要
- **@supabase/supabase-js**: ^2.90.1
  - 新テーブルへのデータ挿入・取得に使用
- **date-fns**: ^4.1.0
  - 日付操作に使用（必要に応じて）
- **React**: 19.2.3
  - Client Component での状態管理

**依存関係で注意すべき点:**
- Next.js 16系ではServer Componentsがデフォルト。DBアクセスはServer Componentで行う
- Supabase v2系のAPIを使用（createClient は SSR用とClient用で異なる）

## 実装アプローチ

### 新しいデータモデル: `suggestion_display_log`

提案バナーの表示履歴を記録する新しいテーブルを追加します。

**テーブル構造:**
```typescript
interface SuggestionDisplayLog {
  id: string;                    // UUID
  user_id: string;               // 外部キー: auth.users.id
  suggestion_type: 'level_up' | 'level_down';
  target_level?: 'bronze' | 'silver' | 'gold'; // level_upの場合のみ
  display_date: string;          // 表示した日（YYYY-MM-DD形式）
  created_at: Date;
}
```

**制約:**
- UNIQUE制約: `(user_id, suggestion_type, target_level, display_date)`
  - 同じ日に同じ種類の提案を複数回記録しないため

### 実装ステップ

#### ステップ1: データベーススキーマの追加
1. マイグレーションファイルを作成
2. `suggestion_display_log` テーブルを定義
3. 適切な制約とインデックスを設定

#### ステップ2: TypeScript型定義の追加
1. `types/index.ts` に `SuggestionDisplayLog` 型を追加
2. Supabase型定義を更新（`lib/supabase/types.ts`）

#### ステップ3: データベースアクセス関数の実装
`lib/db.ts` に以下の関数を追加:

1. **`recordSuggestionDisplay`**: 提案バナーの表示を記録
   - 引数: userId, suggestionType, targetLevel?, displayDate
   - 既に同じ日に記録がある場合は何もしない（UNIQUE制約で保護）

2. **`hasSuggestionBeenDisplayedToday`**: 今日既に提案を表示したか確認
   - 引数: userId, suggestionType, targetLevel?
   - 戻り値: boolean

3. **`getSuggestion`の修正**:
   - 現在の条件判定ロジックは維持
   - 条件を満たした場合、`hasSuggestionBeenDisplayedToday` で今日既に表示済みかチェック
   - 表示済みの場合は `null` を返す
   - 未表示の場合は提案を返す

#### ステップ4: ホーム画面（Server Component）の修正
`app/page.tsx`:
- `getSuggestion()` を呼び出す（既存のまま）
- 返された提案を `SuggestionBanner` に渡す

#### ステップ5: SuggestionBannerコンポーネントの修正
`components/SuggestionBanner.tsx`:
- 提案が表示されたときに、表示記録をサーバーに送信
- APIエンドポイント（`/api/suggestions/display`）を呼び出して記録

#### ステップ6: 新しいAPIエンドポイントの実装
`app/api/suggestions/display/route.ts` を新規作成:
- POSTメソッド: 提案バナーの表示を記録
- Request Body: `{ suggestionType, targetLevel?, displayDate }`
- `recordSuggestionDisplay` を呼び出して記録

## 変更が必要なファイルのリスト

### 新規作成
1. `supabase/migrations/[timestamp]_create_suggestion_display_log.sql`
   - `suggestion_display_log` テーブルの定義

2. `app/api/suggestions/display/route.ts`
   - 提案バナー表示記録用のAPIエンドポイント

### 既存ファイルの修正
3. `types/index.ts`
   - `SuggestionDisplayLog` 型の追加

4. `lib/supabase/types.ts`
   - Supabase型定義の更新（自動生成される場合は要確認）

5. `lib/db.ts`
   - `recordSuggestionDisplay` 関数の追加
   - `hasSuggestionBeenDisplayedToday` 関数の追加
   - `getSuggestion` 関数の修正

6. `components/SuggestionBanner.tsx`
   - 表示時に記録APIを呼び出す処理の追加

7. `docs/data-model.md`
   - `suggestion_display_log` テーブルのドキュメント追加

## 具体的な変更内容

### 1. マイグレーションファイル（SQL）

```sql
-- suggestion_display_log テーブルの作成
CREATE TABLE IF NOT EXISTS public.suggestion_display_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('level_up', 'level_down')),
  target_level TEXT CHECK (target_level IN ('bronze', 'silver', 'gold')),
  display_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, suggestion_type, target_level, display_date)
);

-- インデックスの作成（検索性能向上）
CREATE INDEX idx_suggestion_display_log_user_date
  ON public.suggestion_display_log(user_id, display_date);

-- コメントの追加
COMMENT ON TABLE public.suggestion_display_log IS '提案バナーの表示履歴';
COMMENT ON COLUMN public.suggestion_display_log.id IS '記録ID（UUID）';
COMMENT ON COLUMN public.suggestion_display_log.user_id IS 'ユーザーID';
COMMENT ON COLUMN public.suggestion_display_log.suggestion_type IS '提案種別（level_up/level_down）';
COMMENT ON COLUMN public.suggestion_display_log.target_level IS '対象レベル（level_upの場合のみ）';
COMMENT ON COLUMN public.suggestion_display_log.display_date IS '表示日（YYYY-MM-DD）';
```

### 2. TypeScript型定義の追加

```typescript
// types/index.ts に追加
export type SuggestionType = 'level_up' | 'level_down';

export interface SuggestionDisplayLog {
  id: string;
  userId: string;
  suggestionType: SuggestionType;
  targetLevel?: GoalLevel;
  displayDate: string; // YYYY-MM-DD
  createdAt: Date;
}
```

### 3. lib/db.ts の修正

```typescript
// 型定義の追加
type SuggestionDisplayLogRow = Database['public']['Tables']['suggestion_display_log']['Row'];
type SuggestionDisplayLogInsert = Database['public']['Tables']['suggestion_display_log']['Insert'];

// 型変換ヘルパー関数
function toSuggestionDisplayLog(dbLog: SuggestionDisplayLogRow): SuggestionDisplayLog {
  return {
    id: dbLog.id,
    userId: dbLog.user_id,
    suggestionType: dbLog.suggestion_type as SuggestionType,
    targetLevel: dbLog.target_level as GoalLevel | undefined,
    displayDate: dbLog.display_date,
    createdAt: new Date(dbLog.created_at),
  };
}

// 提案バナーの表示を記録
export async function recordSuggestionDisplay(
  suggestionType: SuggestionType,
  displayDate: string,
  targetLevel?: GoalLevel,
  userId: string = MOCK_USER_ID
): Promise<void> {
  const supabase = await createClient();

  const insertData: SuggestionDisplayLogInsert = {
    user_id: userId,
    suggestion_type: suggestionType,
    target_level: targetLevel || null,
    display_date: displayDate,
  };

  // UNIQUE制約により、同じ日に同じ提案は重複して記録されない
  const { error } = await supabase
    .from('suggestion_display_log')
    .insert(insertData);

  if (error && error.code !== '23505') { // 23505 = unique_violation
    console.error('Failed to record suggestion display:', error);
    throw new Error(`Failed to record suggestion display: ${error.message}`);
  }

  // UNIQUE制約違反の場合は無視（既に記録済み）
}

// 今日既に提案を表示したかチェック
export async function hasSuggestionBeenDisplayedToday(
  suggestionType: SuggestionType,
  today: string, // YYYY-MM-DD
  targetLevel?: GoalLevel,
  userId: string = MOCK_USER_ID
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from('suggestion_display_log')
    .select('id')
    .eq('user_id', userId)
    .eq('suggestion_type', suggestionType)
    .eq('display_date', today);

  // level_upの場合はtarget_levelも条件に含める
  if (suggestionType === 'level_up' && targetLevel) {
    query = query.eq('target_level', targetLevel);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Failed to check suggestion display:', error);
    return false; // エラー時は未表示として扱う
  }

  return data !== null;
}

// getSuggestion関数の修正
export async function getSuggestion(
  userId: string = MOCK_USER_ID
): Promise<Suggestion | null> {
  const today = formatDate(new Date()); // YYYY-MM-DD形式

  // Check for level up suggestion (14 consecutive days at or above each level)
  const records = await getDailyRecords(userId);
  const recentRecords = records.slice(0, 14);

  // Check Gold level up (Gold以上を14日連続)
  const allGoldOrAbove = recentRecords.every((r) => r.achievementLevel === 'gold');
  if (allGoldOrAbove && recentRecords.length === 14) {
    // 今日既に表示済みかチェック
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_up', today, 'gold', userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_up',
        message: 'Goldレベルを14日連続達成しました！目標をレベルアップしませんか？',
        targetLevel: 'gold',
        canEditAllGoals: false,
      };
    }
  }

  // Check Silver level up (Silver以上を14日連続 = Silver or Gold)
  const allSilverOrAbove = recentRecords.every((r) =>
    r.achievementLevel === 'silver' || r.achievementLevel === 'gold'
  );
  if (allSilverOrAbove && recentRecords.length === 14) {
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_up', today, 'silver', userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_up',
        message: 'Silverレベルを14日連続達成しました！目標をレベルアップしませんか？',
        targetLevel: 'silver',
        canEditAllGoals: false,
      };
    }
  }

  // Check Bronze level up (Bronze以上を14日連続 = Bronze or Silver or Gold)
  const allBronzeOrAbove = recentRecords.every((r) =>
    r.achievementLevel === 'bronze' ||
    r.achievementLevel === 'silver' ||
    r.achievementLevel === 'gold'
  );
  if (allBronzeOrAbove && recentRecords.length === 14) {
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_up', today, 'bronze', userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_up',
        message: 'Bronzeレベルを14日連続達成しました！目標をレベルアップしませんか？',
        targetLevel: 'bronze',
        canEditAllGoals: false,
      };
    }
  }

  // Check level down suggestion (failed to achieve Bronze 4+ days in a week)
  const lastWeek = records.slice(0, 7);
  const failedDays = lastWeek.filter((r) => r.achievementLevel === 'none').length;
  if (failedDays >= 4) {
    const alreadyDisplayed = await hasSuggestionBeenDisplayedToday('level_down', today, undefined, userId);
    if (!alreadyDisplayed) {
      return {
        type: 'level_down',
        message: '目標をレベルダウンしませんか？無理のないペースで続けることが大切です。',
        canEditAllGoals: true,
      };
    }
  }

  return null;
}
```

### 4. SuggestionBanner.tsx の修正

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Suggestion } from '@/types';
import { XIcon } from '@/components/icons';

interface SuggestionBannerProps {
  suggestion: Suggestion | null;
}

export function SuggestionBanner({ suggestion }: SuggestionBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasRecorded, setHasRecorded] = useState(false);

  // 提案が表示されたときに記録を送信
  useEffect(() => {
    if (suggestion && isVisible && !hasRecorded) {
      // 表示記録をサーバーに送信
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      fetch('/api/suggestions/display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionType: suggestion.type,
          targetLevel: suggestion.targetLevel,
          displayDate: today,
        }),
      }).catch((error) => {
        console.error('Failed to record suggestion display:', error);
      });

      setHasRecorded(true);
    }
  }, [suggestion, isVisible, hasRecorded]);

  if (!suggestion || !isVisible) {
    return null;
  }

  const bgColor = suggestion.type === 'level_up'
    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
    : 'bg-gradient-to-r from-blue-500 to-indigo-500';

  const editParam = suggestion.canEditAllGoals ? 'all' : suggestion.targetLevel;
  const goalsUrl = `/goals?edit=${editParam}`;

  return (
    <div className={`fixed bottom-6 right-6 ${bgColor} text-white rounded-lg shadow-2xl p-4 max-w-sm z-50 animate-slide-up`}>
      {/* 閉じるボタン */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        aria-label="閉じる"
      >
        <XIcon className="w-4 h-4" />
      </button>

      {/* メッセージ */}
      <div className="pr-6 mb-3">
        <p className="text-sm font-medium leading-relaxed">
          {suggestion.message}
        </p>
      </div>

      {/* アクションボタン */}
      <Link
        href={goalsUrl}
        className="block w-full bg-white text-center py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors"
        style={{ color: suggestion.type === 'level_up' ? '#F59E0B' : '#4F46E5' }}
      >
        目標を編集する
      </Link>
    </div>
  );
}
```

### 5. APIエンドポイント（新規作成）

```typescript
// app/api/suggestions/display/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { recordSuggestionDisplay } from '@/lib/db';
import type { SuggestionType, GoalLevel } from '@/types';

/**
 * POST /api/suggestions/display
 * 提案バナーの表示を記録するAPIエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionType, targetLevel, displayDate } = body;

    // バリデーション
    if (!suggestionType || !displayDate) {
      return NextResponse.json(
        { error: 'suggestionType and displayDate are required' },
        { status: 400 }
      );
    }

    if (!['level_up', 'level_down'].includes(suggestionType)) {
      return NextResponse.json(
        { error: 'Invalid suggestionType' },
        { status: 400 }
      );
    }

    // 日付形式チェック（簡易版）
    if (!/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
      return NextResponse.json(
        { error: 'Invalid displayDate format (expected YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    await recordSuggestionDisplay(
      suggestionType as SuggestionType,
      displayDate,
      targetLevel as GoalLevel | undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record suggestion display:', error);
    return NextResponse.json(
      { error: 'Failed to record suggestion display' },
      { status: 500 }
    );
  }
}
```

## 想定される影響範囲

### データベース
- 新しいテーブル `suggestion_display_log` を追加
- 既存のテーブルには影響なし

### フロントエンド
- `SuggestionBanner` コンポーネントに表示記録処理を追加
- Server Component（`app/page.tsx`）は変更なし

### バックエンド
- `lib/db.ts` に新しい関数を追加、既存の `getSuggestion` を修正
- 新しいAPIエンドポイント `/api/suggestions/display` を追加

### パフォーマンス
- `getSuggestion` の実行時に追加のDBクエリが1回発生
- インデックスを適切に設定しているため、パフォーマンスへの影響は最小限

## テスト方針

### 手動テスト項目

1. **提案バナーの初回表示**
   - [ ] 14日連続達成時に提案バナーが表示されること
   - [ ] 7日中4日未達時に提案バナーが表示されること

2. **同日の再表示抑制**
   - [ ] 一度表示された提案バナーを×ボタンで閉じる
   - [ ] ページをリロードしても、同じ日には再表示されないこと

3. **日付変更後の挙動**
   - [ ] 翌日になったら提案バナーが非表示になること（条件を満たさない場合）
   - [ ] さらに条件を満たしたら、再度提案バナーが表示されること

4. **データベース記録の確認**
   - [ ] `suggestion_display_log` テーブルに正しく記録されていること
   - [ ] UNIQUE制約が正しく機能していること

### 統合テスト（将来の拡張）
- E2Eテストフレームワーク（Playwright等）を使用した自動テスト
- 日付を操作するモックを使用したテスト

## 実装手順（ステップバイステップ）

1. **マイグレーションファイルの作成**
   - Supabase CLIで新しいマイグレーションを作成
   - `suggestion_display_log` テーブルを定義

2. **型定義の更新**
   - `types/index.ts` に `SuggestionDisplayLog` 型を追加
   - Supabase型定義を再生成（必要に応じて）

3. **データベースアクセス関数の実装**
   - `lib/db.ts` に新しい関数を追加
   - `getSuggestion` 関数を修正

4. **APIエンドポイントの実装**
   - `app/api/suggestions/display/route.ts` を作成

5. **SuggestionBannerコンポーネントの修正**
   - 表示時にAPIを呼び出す処理を追加

6. **動作確認**
   - ローカル環境でテスト
   - 各テスト項目を確認

7. **ドキュメント更新**
   - `docs/data-model.md` に新しいテーブルを追加

## リスクと対策

### リスク1: ユーザーのブラウザ時刻とサーバー時刻のずれ
- **対策**: サーバーサイドで日付を決定（`getSuggestion` 内で `formatDate(new Date())` を使用）
- クライアント側での日付取得も行うが、サーバー側の判定を優先

### リスク2: 複数タブで同時にページを開いた場合の重複記録
- **対策**: UNIQUE制約により重複は防止される
- APIエンドポイントでエラーコード 23505（unique_violation）を無視

### リスク3: ネットワークエラーによる記録失敗
- **対策**: 記録失敗してもユーザー体験に影響しない（提案バナーは表示される）
- エラーログに記録して後で確認可能にする

## 今後の拡張可能性

- 提案バナーの表示頻度を調整（例：1週間に1回のみ表示）
- ユーザー設定で提案バナーの表示/非表示を切り替える機能
- 提案バナーの表示統計を管理画面で確認できるようにする
