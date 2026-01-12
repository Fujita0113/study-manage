# 記録・日報画面（/record）Supabase接続 実装計画

## 1. 作業の目的と概要

現在、記録・日報画面（[/record/page.tsx](../app/record/page.tsx)）はAPI Routes経由でデータを取得・保存していますが、[lib/db.ts](../lib/db.ts)の`createDailyRecord`関数がモックデータを返しているため、実際のSupabaseへの保存が行われていません。

この実装では、ホーム画面（[/page.tsx](../app/page.tsx)）で既に実装されている`getDailyRecords`関数の実装パターンを参考にしながら、記録・日報画面でSupabaseへの実際のPOSTが行われるようにします。

## 2. 使用する主要モジュールとバージョン

```json
{
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.90.1",
  "next": "16.1.1"
}
```

### 依存関係で注意すべき点

- **@supabase/ssr 0.8.0**: `createServerClient`を使用してServer Componentsからのアクセスを実現
- **Next.js 16.1.1**: App Router環境で、Route Handlersは Server Componentsの一種として動作
- **Server-side vs Client-side**:
  - Route Handlers（API Routes）はサーバーサイドで動作するため、[lib/supabase/server.ts](../lib/supabase/server.ts)の`createClient`を使用
  - [app/record/page.tsx](../app/record/page.tsx)は`'use client'`ディレクティブを持つClient Componentだが、データ保存はRoute Handlers経由で行われるため問題なし

## 3. 現状分析

### 3.1 ホーム画面の実装（参考実装）

[lib/db.ts:90-125](../lib/db.ts#L90-L125)の`getDailyRecords`関数は既にSupabaseと接続されています：

```typescript
export async function getDailyRecords(
  userId: string = MOCK_USER_ID,
  options?: { startDate?: string; endDate?: string }
): Promise<DailyRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId);

  if (options?.startDate) {
    query = query.gte('date', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('date', options.endDate);
  }

  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch daily records:', error);
    return [];
  }

  return (data || []).map(toDailyRecord);
}
```

**ポイント**:
- `createClient()`は[lib/supabase/server.ts](../lib/supabase/server.ts)からインポート（Server Components用）
- `toDailyRecord`でSupabaseのsnake_case形式からTypeScriptのcamelCase形式に変換
- エラーハンドリングと詳細なログ出力

### 3.2 記録・日報画面の現状

[app/record/page.tsx:49-81](../app/record/page.tsx#L49-L81)では、以下のフローでデータを保存しています：

```typescript
const handleSubmit = async () => {
  try {
    const response = await fetch('/api/daily-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: today,
        achievementLevel,
        doText: learningContent.trim() || 'なし',
        journalText: journal || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create daily record');
    }

    router.push('/');
  } catch (error) {
    console.error('Failed to save record:', error);
    alert('記録の保存に失敗しました');
  }
};
```

[app/api/daily-records/route.ts:53-82](../app/api/daily-records/route.ts#L53-L82)のPOSTハンドラーは：

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, achievementLevel, doText, journalText } = body;

    if (!date || !achievementLevel) {
      return NextResponse.json(
        { error: 'date and achievementLevel are required' },
        { status: 400 }
      );
    }

    const record = await createDailyRecord({
      date,
      achievementLevel,
      doText,
      journalText,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Failed to create daily record:', error);
    return NextResponse.json(
      { error: 'Failed to create daily record' },
      { status: 500 }
    );
  }
}
```

### 3.3 問題点

[lib/db.ts:134-146](../lib/db.ts#L134-L146)の`createDailyRecord`関数がモックデータを返しており、実際のSupabase INSERTが行われていません：

```typescript
export async function createDailyRecord(
  data: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord> {
  const newRecord: DailyRecord = {
    ...data,
    id: `record-${Date.now()}`,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return newRecord; // ← モックデータを返すだけ
}
```

## 4. 変更が必要なファイルのリスト

1. **[lib/db.ts](../lib/db.ts)** - `createDailyRecord`関数をSupabase対応に変更
2. **[lib/db.ts](../lib/db.ts)** - `getDailyRecordByDate`関数もSupabase対応に変更（記録画面の初期チェックで使用されている）

## 5. 各ファイルでの具体的な変更内容

### 5.1 lib/db.ts - createDailyRecord関数の実装

**変更箇所**: [lib/db.ts:134-146](../lib/db.ts#L134-L146)

**変更内容**:
```typescript
export async function createDailyRecord(
  data: Omit<DailyRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord> {
  const supabase = await createClient();

  // TypeScriptのcamelCaseをSupabaseのsnake_caseに変換
  const insertData = {
    user_id: userId,
    date: data.date,
    achievement_level: data.achievementLevel,
    do_text: data.doText || null,
    journal_text: data.journalText || null,
  };

  const { data: inserted, error } = await supabase
    .from('daily_records')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Failed to create daily record:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Insert data:', insertData);
    throw new Error(`Failed to create daily record: ${error.message}`);
  }

  return toDailyRecord(inserted);
}
```

**ポイント**:
- `getDailyRecords`と同じパターンで`createClient()`を使用
- データ形式をcamelCaseからsnake_caseに変換
- `.insert()`でデータを挿入
- `.select().single()`で挿入されたレコードを取得（IDやタイムスタンプを含む）
- `toDailyRecord`で結果をTypeScript型に変換
- エラー時は詳細ログを出力してから例外をスロー

### 5.2 lib/db.ts - getDailyRecordByDate関数の実装

**変更箇所**: [lib/db.ts:127-132](../lib/db.ts#L127-L132)

**現在の実装**:
```typescript
export async function getDailyRecordByDate(
  date: string,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord | null> {
  return mockDailyRecords.find((r) => r.date === date) || null;
}
```

**変更後**:
```typescript
export async function getDailyRecordByDate(
  date: string,
  userId: string = MOCK_USER_ID
): Promise<DailyRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle(); // 0件または1件を取得

  if (error) {
    console.error('Failed to fetch daily record by date:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('User ID:', userId);
    console.error('Date:', date);
    return null;
  }

  return data ? toDailyRecord(data) : null;
}
```

**ポイント**:
- `.maybeSingle()`を使用して0件または1件のレコードを取得
- エラー時はnullを返す（記録画面の初期チェックで使用されるため、エラーで止めない）
- データがあれば`toDailyRecord`で変換して返す

## 6. 実装手順（ステップバイステップ）

### Step 1: getDailyRecordByDate関数の実装
1. [lib/db.ts:127-132](../lib/db.ts#L127-L132)を上記の実装に変更
2. この関数は[app/record/page.tsx:27](../app/record/page.tsx#L27)で使用されており、今日の記録が既に存在するかチェックしている

### Step 2: createDailyRecord関数の実装
1. [lib/db.ts:134-146](../lib/db.ts#L134-L146)を上記の実装に変更
2. この関数は[app/api/daily-records/route.ts:67](../app/api/daily-records/route.ts#L67)で呼び出されている

### Step 3: 動作確認
1. `npm run dev`でアプリを起動
2. `/record`ページにアクセス
3. 学習内容サマリーと達成度を入力
4. 「記録を確定してロックする」ボタンをクリック
5. Supabaseのdaily_recordsテーブルに新しいレコードが挿入されることを確認
6. ホーム画面（`/`）にリダイレクトされ、新しい記録がカードとして表示されることを確認

## 7. 想定される影響範囲

### 直接影響を受けるファイル
- [lib/db.ts](../lib/db.ts) - 2つの関数を実装

### 間接的に影響を受けるファイル（動作確認が必要）
- [app/record/page.tsx](../app/record/page.tsx) - 初期チェックと保存処理
- [app/api/daily-records/route.ts](../app/api/daily-records/route.ts) - GET/POSTハンドラー
- [app/page.tsx](../app/page.tsx) - ホーム画面での記録表示

### 影響を受けないファイル
- [lib/supabase/client.ts](../lib/supabase/client.ts) - Client Components用（今回は使用しない）
- [lib/supabase/types.ts](../lib/supabase/types.ts) - 型定義（変更不要）
- [lib/supabase/server.ts](../lib/supabase/server.ts) - 既存実装を使用

## 8. テスト方針

### 8.1 手動テスト項目

#### 正常系
- [ ] 記録画面で新しい記録を作成できる
- [ ] 学習内容サマリーのみ入力して保存できる
- [ ] 学習内容サマリー + 自由記述を入力して保存できる
- [ ] 保存後、ホーム画面にリダイレクトされる
- [ ] ホーム画面で新しい記録がカードとして表示される
- [ ] Supabaseのdaily_recordsテーブルに正しくデータが保存される

#### 異常系
- [ ] 達成度を選択せずに保存しようとするとアラートが表示される
- [ ] 同じ日付で2回目の記録を作成しようとすると日詳細ページにリダイレクトされる
- [ ] Supabaseへの接続に失敗した場合、適切なエラーメッセージが表示される

### 8.2 確認すべきSupabaseデータ

保存されたレコードの以下のフィールドを確認：
- `user_id`: MOCK_USER_IDと一致
- `date`: YYYY-MM-DD形式の今日の日付
- `achievement_level`: bronze/silver/goldのいずれか
- `do_text`: 入力した学習内容サマリー（またはnull）
- `journal_text`: 入力した自由記述（またはnull）
- `created_at`: 自動生成されたタイムスタンプ
- `updated_at`: 自動生成されたタイムスタンプ

## 9. 既知の制約事項

- **ユーザー認証未実装**: 現在は`MOCK_USER_ID`を使用しているため、全てのデータが同じユーザーIDで保存される
- **同一日付の重複チェック**: クライアント側でチェックしているが、データベースレベルでのUNIQUE制約も必要（将来の改善項目）
- **トランザクション未使用**: 単純なINSERT操作のみなので現時点では不要

## 10. 今後の拡張ポイント

- ユーザー認証機能の追加（Supabase Auth）
- 楽観的ロック（updated_atを使用した競合検知）
- ストリーク自動更新ロジックの実装
- エラーログの集約（Sentryなど）
