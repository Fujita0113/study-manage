# Supabase接続実装計画（段階的アプローチ）

## 概要
モックデータで動作している学習管理アプリを、Supabaseの実データベースに接続する。
**各ステップで動作確認用のテストコードを用意し、確実に進めていく。**

---

## 実装フェーズ

### フェーズ0: 事前準備と接続確認
### フェーズ1: DailyRecords取得のSupabase対応
### フェーズ2: ホーム画面での統合テスト
### フェーズ3: クリーンアップ

---

## フェーズ0: 事前準備と接続確認

### タスク0-1: Supabase接続テストスクリプトの作成

**目的**: Supabaseに接続できるか、環境変数が正しく設定されているかを確認する。

**ファイル作成**: `scripts/test-supabase-connection.ts`

```typescript
/**
 * Supabase接続テストスクリプト
 * 実行方法: npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js';

async function testConnection() {
  console.log('🔍 Supabase接続テストを開始...\n');

  // 環境変数の確認
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 環境変数が設定されていません');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.log('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:', supabaseKey ? '✅' : '❌');
    process.exit(1);
  }

  console.log('✅ 環境変数の確認完了');
  console.log('   URL:', supabaseUrl);
  console.log('   Key:', supabaseKey.substring(0, 20) + '...\n');

  // クライアント作成
  const supabase = createClient(supabaseUrl, supabaseKey);

  // テスト1: データベース接続確認
  console.log('📡 テスト1: データベース接続確認...');
  const { data, error } = await supabase.from('user_settings').select('count');

  if (error) {
    console.error('❌ 接続失敗:', error.message);
    process.exit(1);
  }

  console.log('✅ データベース接続成功\n');

  // テスト2: テーブル存在確認
  console.log('📋 テスト2: 必須テーブルの存在確認...');
  const tables = ['user_settings', 'goals', 'daily_records', 'streaks', 'goal_history_slots'];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      console.error(`❌ テーブル "${table}" が見つかりません:`, error.message);
    } else {
      console.log(`✅ テーブル "${table}" が存在します`);
    }
  }

  console.log('\n✨ すべてのテストが完了しました！');
}

testConnection();
```

**確認方法**:
```bash
npx tsx scripts/test-supabase-connection.ts
```

**期待される出力**:
```
🔍 Supabase接続テストを開始...
✅ 環境変数の確認完了
📡 テスト1: データベース接続確認...
✅ データベース接続成功
📋 テスト2: 必須テーブルの存在確認...
✅ テーブル "user_settings" が存在します
✅ テーブル "goals" が存在します
✅ テーブル "daily_records" が存在します
✅ テーブル "streaks" が存在します
✅ テーブル "goal_history_slots" が存在します
✨ すべてのテストが完了しました！
```

**完了条件**:
- [ ] スクリプトがエラーなく実行される
- [ ] すべてのテーブルが存在することが確認される

---

### タスク0-2: テストデータ存在確認スクリプトの作成

**目的**: MOCK_USER_IDのテストデータがSupabaseに正しく挿入されているかを確認する。

**ファイル作成**: `scripts/test-mock-data.ts`

```typescript
/**
 * テストデータ存在確認スクリプト
 * 実行方法: npx tsx scripts/test-mock-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testMockData() {
  console.log('🔍 テストデータの確認を開始...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );

  // テスト1: ユーザー設定の確認
  console.log('📋 テスト1: ユーザー設定の確認...');
  const { data: userSettings, error: userError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', MOCK_USER_ID)
    .single();

  if (userError || !userSettings) {
    console.error('❌ ユーザー設定が見つかりません:', userError?.message);
  } else {
    console.log('✅ ユーザー設定が存在します');
    console.log('   ID:', userSettings.id);
  }

  // テスト2: 目標の確認
  console.log('\n📋 テスト2: 目標の確認...');
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', MOCK_USER_ID)
    .order('level');

  if (goalsError) {
    console.error('❌ 目標の取得に失敗:', goalsError.message);
  } else {
    console.log(`✅ 目標が ${goals?.length || 0} 件見つかりました`);
    goals?.forEach(goal => {
      console.log(`   - ${goal.level}: ${goal.description}`);
    });
  }

  // テスト3: 日次記録の確認
  console.log('\n📋 テスト3: 日次記録の確認...');
  const { data: records, error: recordsError } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', MOCK_USER_ID)
    .order('date', { ascending: false })
    .limit(5);

  if (recordsError) {
    console.error('❌ 日次記録の取得に失敗:', recordsError.message);
  } else {
    console.log(`✅ 日次記録が ${records?.length || 0} 件見つかりました（最新5件）`);
    records?.forEach(record => {
      console.log(`   - ${record.date}: ${record.achievement_level}`);
    });
  }

  // テスト4: ストリークの確認
  console.log('\n📋 テスト4: ストリークの確認...');
  const { data: streak, error: streakError } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', MOCK_USER_ID)
    .single();

  if (streakError || !streak) {
    console.error('❌ ストリークが見つかりません:', streakError?.message);
  } else {
    console.log('✅ ストリークが存在します');
    console.log(`   現在: ${streak.current_streak}日連続`);
    console.log(`   最高: ${streak.longest_streak}日連続`);
  }

  // テスト5: 目標履歴スロットの確認
  console.log('\n📋 テスト5: 目標履歴スロットの確認...');
  const { data: slots, error: slotsError } = await supabase
    .from('goal_history_slots')
    .select('*')
    .eq('user_id', MOCK_USER_ID)
    .order('start_date', { ascending: false });

  if (slotsError) {
    console.error('❌ 目標履歴スロットの取得に失敗:', slotsError.message);
  } else {
    console.log(`✅ 目標履歴スロットが ${slots?.length || 0} 件見つかりました`);
    slots?.forEach(slot => {
      console.log(`   - ${slot.start_date} ~ ${slot.end_date || '現在'}: ${slot.change_reason}`);
    });
  }

  console.log('\n✨ すべてのテストが完了しました！');
}

testMockData();
```

**確認方法**:
```bash
npx tsx scripts/test-mock-data.ts
```

**期待される出力**:
```
🔍 テストデータの確認を開始...
📋 テスト1: ユーザー設定の確認...
✅ ユーザー設定が存在します
📋 テスト2: 目標の確認...
✅ 目標が 3 件見つかりました
   - bronze: 30分だけプログラミングする
   - silver: 1つの機能を完成させる
   - gold: リファクタリングまで完了させる
📋 テスト3: 日次記録の確認...
✅ 日次記録が 5 件見つかりました（最新5件）
   - 2026-01-10: bronze
   - 2026-01-09: bronze
   ...
📋 テスト4: ストリークの確認...
✅ ストリークが存在します
   現在: 14日連続
   最高: 14日連続
📋 テスト5: 目標履歴スロットの確認...
✅ 目標履歴スロットが 2 件見つかりました
✨ すべてのテストが完了しました！
```

**完了条件**:
- [ ] すべてのテストデータが存在することが確認される
- [ ] 目標が3件（Bronze/Silver/Gold）存在する
- [ ] 日次記録が14件存在する

---

## フェーズ1: DailyRecords取得のSupabase対応

### タスク1-1: 型変換ヘルパー関数の作成

**目的**: Supabaseのsnake_case形式をTypeScriptのcamelCase形式に変換する。

**ファイル変更**: `lib/db.ts`

**追加するコード**（ファイル冒頭に追加）:

```typescript
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

// Supabaseのdaily_recordsテーブルの型
type DailyRecordRow = Database['public']['Tables']['daily_records']['Row'];

/**
 * Supabaseのsnake_case形式をTypeScriptのcamelCase形式に変換
 */
function toDailyRecord(dbRecord: DailyRecordRow): DailyRecord {
  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    date: dbRecord.date,
    achievementLevel: dbRecord.achievement_level as AchievementLevel,
    doText: dbRecord.do_text || undefined,
    journalText: dbRecord.journal_text || undefined,
    createdAt: new Date(dbRecord.created_at),
    updatedAt: new Date(dbRecord.updated_at),
  };
}
```

**確認方法**: TypeScriptのコンパイルエラーがないことを確認

```bash
npm run build
```

**完了条件**:
- [ ] TypeScriptエラーが発生しない
- [ ] ビルドが成功する

---

### タスク1-2: getDailyRecords関数の書き換え（段階的）

**目的**: getDailyRecords関数をSupabase対応に書き換える。

**ステップ1-2-1**: まず基本的な取得機能のみ実装

**ファイル変更**: `lib/db.ts`の`getDailyRecords`関数

```typescript
export async function getDailyRecords(
  userId: string = MOCK_USER_ID,
  options?: { startDate?: string; endDate?: string }
): Promise<DailyRecord[]> {
  const supabase = await createClient();

  // 基本クエリ: user_idで絞り込み
  let query = supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId);

  // 日付範囲フィルタ
  if (options?.startDate) {
    query = query.gte('date', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('date', options.endDate);
  }

  // 新しい順にソート
  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch daily records:', error);
    return [];
  }

  return (data || []).map(toDailyRecord);
}
```

**完了条件**:
- [ ] TypeScriptエラーが発生しない
- [ ] ビルドが成功する

---

### タスク1-3: getDailyRecords関数の単体テストスクリプト作成

**目的**: getDailyRecords関数が正しくデータを取得できるか確認する。

**ファイル作成**: `scripts/test-get-daily-records.ts`

```typescript
/**
 * getDailyRecords関数のテストスクリプト
 * 実行方法: npx tsx scripts/test-get-daily-records.ts
 */

import { getDailyRecords } from '@/lib/db';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testGetDailyRecords() {
  console.log('🔍 getDailyRecords関数のテストを開始...\n');

  // テスト1: すべての記録を取得
  console.log('📋 テスト1: すべての記録を取得...');
  const allRecords = await getDailyRecords(MOCK_USER_ID);
  console.log(`✅ ${allRecords.length}件の記録を取得しました`);

  if (allRecords.length > 0) {
    const firstRecord = allRecords[0];
    console.log('   最新の記録:');
    console.log('   - 日付:', firstRecord.date);
    console.log('   - 達成度:', firstRecord.achievementLevel);
    console.log('   - 学習内容:', firstRecord.doText?.substring(0, 50) + '...');
  }

  // テスト2: 日付範囲で絞り込み
  console.log('\n📋 テスト2: 日付範囲で絞り込み...');
  const today = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const filteredRecords = await getDailyRecords(MOCK_USER_ID, {
    startDate,
    endDate: today
  });

  console.log(`✅ 過去14日分: ${filteredRecords.length}件の記録を取得しました`);
  console.log(`   期間: ${startDate} ~ ${today}`);

  // テスト3: データ型の確認
  console.log('\n📋 テスト3: データ型の確認...');
  if (filteredRecords.length > 0) {
    const record = filteredRecords[0];
    console.log('   - id:', typeof record.id, '✅');
    console.log('   - userId:', typeof record.userId, '✅');
    console.log('   - date:', typeof record.date, '✅');
    console.log('   - achievementLevel:', typeof record.achievementLevel, '✅');
    console.log('   - createdAt:', record.createdAt instanceof Date ? 'Date' : typeof record.createdAt, '✅');
    console.log('   - updatedAt:', record.updatedAt instanceof Date ? 'Date' : typeof record.updatedAt, '✅');
  }

  // テスト4: ソート順の確認
  console.log('\n📋 テスト4: ソート順の確認（新しい順）...');
  if (allRecords.length >= 2) {
    const isDescending = allRecords[0].date >= allRecords[1].date;
    if (isDescending) {
      console.log('✅ 正しく新しい順にソートされています');
      console.log(`   1番目: ${allRecords[0].date}`);
      console.log(`   2番目: ${allRecords[1].date}`);
    } else {
      console.error('❌ ソート順が正しくありません');
    }
  }

  console.log('\n✨ すべてのテストが完了しました！');
}

testGetDailyRecords();
```

**確認方法**:
```bash
npx tsx scripts/test-get-daily-records.ts
```

**期待される出力**:
```
🔍 getDailyRecords関数のテストを開始...
📋 テスト1: すべての記録を取得...
✅ 14件の記録を取得しました
   最新の記録:
   - 日付: 2026-01-10
   - 達成度: bronze
   - 学習内容: モニタリング・ログ管理について学習...
📋 テスト2: 日付範囲で絞り込み...
✅ 過去14日分: 14件の記録を取得しました
📋 テスト3: データ型の確認...
   - id: string ✅
   - userId: string ✅
   - date: string ✅
   - achievementLevel: string ✅
   - createdAt: Date ✅
   - updatedAt: Date ✅
📋 テスト4: ソート順の確認（新しい順）...
✅ 正しく新しい順にソートされています
✨ すべてのテストが完了しました！
```

**完了条件**:
- [ ] すべてのテストが成功する
- [ ] 14件の記録が取得される
- [ ] データ型が正しい
- [ ] ソート順が正しい

---

### タスク1-4: getSuggestion関数の動作確認

**目的**: getSuggestion関数がSupabase対応のgetDailyRecordsを使って正しく動作するか確認する。

**注意**: getSuggestion関数自体は変更不要（内部でgetDailyRecordsを呼んでいるため、自動的にSupabase対応になる）

**ファイル作成**: `scripts/test-get-suggestion.ts`

```typescript
/**
 * getSuggestion関数のテストスクリプト
 * 実行方法: npx tsx scripts/test-get-suggestion.ts
 */

import { getSuggestion } from '@/lib/db';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testGetSuggestion() {
  console.log('🔍 getSuggestion関数のテストを開始...\n');

  console.log('📋 提案の取得...');
  const suggestion = await getSuggestion(MOCK_USER_ID);

  if (suggestion) {
    console.log('✅ 提案が生成されました:');
    console.log('   - タイプ:', suggestion.type);
    console.log('   - メッセージ:', suggestion.message);

    if (suggestion.type === 'level_up') {
      console.log('   - 対象レベル:', suggestion.targetLevel);
      console.log('   - 全目標編集可能:', suggestion.canEditAllGoals ? 'はい' : 'いいえ');
    }

    if (suggestion.type === 'level_down') {
      console.log('   - 全目標編集可能:', suggestion.canEditAllGoals ? 'はい' : 'いいえ');
    }
  } else {
    console.log('ℹ️  現在、提案はありません');
    console.log('   （これは正常です。条件を満たしていない場合、提案は表示されません）');
  }

  console.log('\n✨ テストが完了しました！');
}

testGetSuggestion();
```

**確認方法**:
```bash
npx tsx scripts/test-get-suggestion.ts
```

**期待される出力**（14日連続Bronze達成の場合）:
```
🔍 getSuggestion関数のテストを開始...
📋 提案の取得...
✅ 提案が生成されました:
   - タイプ: level_up
   - メッセージ: Bronzeレベルを14日連続達成しました！目標をレベルアップしませんか？
   - 対象レベル: bronze
   - 全目標編集可能: いいえ
✨ テストが完了しました！
```

**完了条件**:
- [ ] テストがエラーなく実行される
- [ ] 提案が正しく生成される（条件を満たす場合）

---

## フェーズ2: ホーム画面での統合テスト

### タスク2-1: 開発サーバーでの動作確認

**目的**: ホーム画面が実際のSupabaseデータを表示することを確認する。

**確認方法**:
1. 開発サーバーを起動
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000/` にアクセス

3. ブラウザの開発者ツール（F12）を開き、コンソールを確認

**確認項目**:
- [ ] デイリーレポートカードが表示される
- [ ] カードに正しい日付が表示される（例: 2026年1月10日（金））
- [ ] 達成度バッジが表示される（Bronze）
- [ ] 学習内容が箇条書きで表示される
- [ ] 日報の抜粋が表示される
- [ ] 提案バナーが画面右下に表示される
- [ ] コンソールにエラーが表示されない

**スクリーンショット**: 動作確認時にスクリーンショットを撮影して記録

**完了条件**:
- [ ] すべての確認項目がクリアされる
- [ ] コンソールエラーがない

---

### タスク2-2: カードクリック時の動作確認

**目的**: デイリーレポートカードをクリックして日詳細画面に遷移することを確認する。

**確認方法**:
1. ホーム画面でデイリーレポートカードをクリック
2. 日詳細画面（`/day/[日付]`）に遷移することを確認
3. 詳細情報が表示されることを確認

**注意**: 日詳細画面がまだSupabase対応していない場合、この段階ではエラーが発生する可能性があります。その場合は後続タスクで対応します。

**完了条件**:
- [ ] カードクリックで遷移する
- [ ] URLが `/day/YYYY-MM-DD` の形式になる

---

### タスク2-3: 提案バナーの動作確認

**目的**: 提案バナーが正しく表示され、クリック時の動作を確認する。

**確認方法**:
1. ホーム画面で提案バナーを確認
2. バナーのメッセージを確認（「Bronzeレベルを14日連続達成しました！」）
3. ×ボタンで閉じられることを確認
4. アクションボタンをクリックして目標編集画面に遷移することを確認

**完了条件**:
- [ ] 提案バナーが表示される
- [ ] ×ボタンで閉じられる
- [ ] アクションボタンで目標編集画面に遷移する

---

## フェーズ3: クリーンアップ

### タスク3-1: モックデータのインポート削除

**目的**: lib/db.tsから使用していないモックデータのインポートを削除する。

**ファイル変更**: `lib/db.ts`

**削除するコード**:
```typescript
import {
  mockUserSettings,
  mockGoals,
  mockDailyRecords,  // ← これを削除
  mockStreak,
  mockGoalHistorySlots,
  MOCK_USER_ID,  // ← これは残す（まだ使用中）
} from './mockData';
```

**変更後**:
```typescript
import {
  mockUserSettings,
  mockGoals,
  mockStreak,
  mockGoalHistorySlots,
  MOCK_USER_ID,
} from './mockData';
```

**確認方法**:
```bash
npm run build
```

**完了条件**:
- [ ] ビルドエラーが発生しない
- [ ] ホーム画面が引き続き正常に動作する

---

### タスク3-2: ドキュメントの更新

**目的**: 完了した作業を記録し、次のステップを明確にする。

**ファイル作成/更新**: `docs/supabase-integration-status.md`

```markdown
# Supabase統合状況

## 完了済み

### ホーム画面（app/page.tsx）
- ✅ getDailyRecords関数のSupabase対応
- ✅ getSuggestion関数のSupabase対応
- ✅ デイリーレポートカード表示
- ✅ 提案バナー表示

## 未対応（今後の作業）

### その他の画面
- ⏸️ 記録画面（app/day/[date]/page.tsx）
  - createDailyRecord関数のSupabase対応が必要
  - updateDailyRecord関数のSupabase対応が必要

- ⏸️ カレンダー画面（app/calendar/page.tsx）
  - getDailyRecords関数は既に対応済み
  - 画面レンダリングの確認が必要

- ⏸️ 目標編集画面（app/goals/edit/page.tsx）
  - getGoals関数のSupabase対応が必要
  - updateGoal関数のSupabase対応が必要
  - createGoalHistorySlot関数のSupabase対応が必要

- ⏸️ 目標変遷画面（app/goals/history/page.tsx）
  - getGoalHistorySlots関数のSupabase対応が必要

### その他
- ⏸️ ストリーク機能
  - getStreak関数のSupabase対応が必要
  - updateStreak関数のSupabase対応が必要

## 次のステップ

1. 記録画面のSupabase対応
2. カレンダー画面の動作確認
3. 目標編集画面のSupabase対応
4. 目標変遷画面のSupabase対応
```

**完了条件**:
- [ ] ドキュメントが作成される
- [ ] 完了内容と未対応内容が明確になる

---

## 全体の完了条件

### 必須項目
- [ ] フェーズ0のすべてのタスクが完了している
- [ ] フェーズ1のすべてのタスクが完了している
- [ ] フェーズ2のすべてのタスクが完了している
- [ ] フェーズ3のすべてのタスクが完了している
- [ ] ホーム画面がSupabaseの実データを表示している
- [ ] すべてのテストスクリプトが成功している
- [ ] ビルドエラーがない

### 確認事項
- [ ] ホーム画面でデイリーレポートカードが表示される
- [ ] カードに正しいデータが表示される
- [ ] 提案バナーが正しく表示される
- [ ] コンソールエラーがない
- [ ] パフォーマンスに問題がない

---

## トラブルシューティング

### よくあるエラーと対処法

#### エラー1: "Failed to fetch daily records"
**原因**: Supabase接続エラーまたは環境変数の設定ミス

**対処法**:
1. `scripts/test-supabase-connection.ts`を実行して接続を確認
2. `.env.local`の環境変数を確認
3. Supabaseダッシュボードでプロジェクトが起動しているか確認

#### エラー2: "relation 'daily_records' does not exist"
**原因**: マイグレーションが実行されていない

**対処法**:
1. Supabaseダッシュボードの SQL Editor を開く
2. `supabase/migrations/001_initial_schema.sql` の内容を実行
3. `scripts/test-mock-data.ts`でデータを確認

#### エラー3: "No rows returned"
**原因**: テストデータが挿入されていない

**対処法**:
1. `scripts/test-mock-data.ts`を実行してデータを確認
2. データがない場合、マイグレーションスクリプトを再実行

---

## 推定作業時間

- フェーズ0: 30分（接続確認）
- フェーズ1: 1時間（関数の書き換え）
- フェーズ2: 30分（統合テスト）
- フェーズ3: 15分（クリーンアップ）

**合計**: 約2時間15分

---

## 備考

- 各フェーズは順番に実行すること
- 各タスクの完了条件をすべて満たしてから次に進むこと
- エラーが発生したら、トラブルシューティングセクションを参照すること
- わからないことがあれば、すぐに質問すること
