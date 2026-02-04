/**
 * daily_records.do_text → other_todos + daily_todo_records 移行スクリプト
 *
 * 既存のdaily_records.do_textの内容を:
 * 1. 行ごとに分割してother_todosに登録
 * 2. 対応するdaily_todo_recordsを作成（達成済みとしてマーク）
 *
 * 実行方法: npx tsx scripts/migrate-do-text.ts
 *
 * 注意:
 * - このスクリプトは冪等性がありません。1度だけ実行してください。
 * - 実行前にバックアップを取ることを推奨します。
 */

import { createClient } from '@supabase/supabase-js';

// 環境変数の読み込み
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface DailyRecord {
  id: string;
  user_id: string;
  date: string;
  do_text: string | null;
}

interface OtherTodo {
  id: string;
  content: string;
}

async function migrate() {
  console.log('=== daily_records.do_text → other_todos 移行開始 ===\n');

  // 1. do_textが存在するdaily_recordsを全て取得
  console.log('1. do_textが存在するdaily_recordsを取得中...');
  const { data: dailyRecords, error: fetchError } = await supabase
    .from('daily_records')
    .select('id, user_id, date, do_text')
    .not('do_text', 'is', null)
    .neq('do_text', '');

  if (fetchError) {
    console.error('daily_records取得エラー:', fetchError);
    process.exit(1);
  }

  if (!dailyRecords || dailyRecords.length === 0) {
    console.log('移行対象のdaily_recordsが見つかりませんでした。');
    return;
  }

  console.log(`✓ ${dailyRecords.length}件のdaily_recordsが見つかりました\n`);

  // 2. ユーザーごとにグループ化
  const recordsByUser = new Map<string, DailyRecord[]>();
  for (const record of dailyRecords as DailyRecord[]) {
    if (!recordsByUser.has(record.user_id)) {
      recordsByUser.set(record.user_id, []);
    }
    recordsByUser.get(record.user_id)!.push(record);
  }

  console.log(`${recordsByUser.size}人のユーザーのデータを処理します\n`);

  let totalTodosCreated = 0;
  let totalRecordsCreated = 0;

  // 3. 各ユーザーごとに処理
  for (const [userId, records] of recordsByUser) {
    console.log(`\n--- ユーザー: ${userId.substring(0, 8)}... の処理開始 ---`);

    // ユーザーの既存other_todosをコンテンツでマップ
    const { data: existingTodos, error: todosError } = await supabase
      .from('other_todos')
      .select('id, content')
      .eq('user_id', userId);

    if (todosError) {
      console.error(`ユーザー ${userId} のother_todos取得エラー:`, todosError);
      continue;
    }

    const todoContentMap = new Map<string, string>();
    for (const todo of (existingTodos || []) as OtherTodo[]) {
      todoContentMap.set(todo.content.toLowerCase().trim(), todo.id);
    }

    // 各daily_recordを処理
    for (const record of records) {
      if (!record.do_text) continue;

      // do_textを行に分割
      const lines = record.do_text
        .split(/[\n\r]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) continue;

      console.log(`  記録 ${record.date}: ${lines.length}行のdo_textを処理`);

      for (const line of lines) {
        const normalizedLine = line.toLowerCase().trim();
        let todoId = todoContentMap.get(normalizedLine);

        // 既存のtodoがなければ作成
        if (!todoId) {
          const { data: newTodo, error: insertError } = await supabase
            .from('other_todos')
            .insert({
              user_id: userId,
              content: line.substring(0, 500), // 500文字制限
              is_archived: true, // 移行データはアーカイブ状態で作成
              last_achieved_at: record.date + 'T00:00:00Z',
            })
            .select('id')
            .single();

          if (insertError) {
            console.error(`    TODO作成エラー (${line.substring(0, 30)}...):`, insertError.message);
            continue;
          }

          todoId = newTodo.id as string;
          todoContentMap.set(normalizedLine, todoId);
          totalTodosCreated++;
          console.log(`    ✓ other_todo作成: "${line.substring(0, 30)}..."`);
        }

        // daily_todo_recordsに達成記録を作成
        const { error: recordError } = await supabase
          .from('daily_todo_records')
          .upsert({
            daily_record_id: record.id,
            todo_type: 'other',
            todo_id: todoId,
            is_achieved: true,
          }, {
            onConflict: 'daily_record_id,todo_type,todo_id',
          });

        if (recordError) {
          console.error(`    daily_todo_record作成エラー:`, recordError.message);
          continue;
        }

        totalRecordsCreated++;
      }
    }

    console.log(`--- ユーザー: ${userId.substring(0, 8)}... の処理完了 ---`);
  }

  console.log('\n=== 移行完了 ===');
  console.log(`作成されたother_todos: ${totalTodosCreated}件`);
  console.log(`作成されたdaily_todo_records: ${totalRecordsCreated}件`);
}

// ドライラン（確認用）
async function dryRun() {
  console.log('=== ドライラン: 移行対象データの確認 ===\n');

  const { data: dailyRecords, error } = await supabase
    .from('daily_records')
    .select('id, user_id, date, do_text')
    .not('do_text', 'is', null)
    .neq('do_text', '');

  if (error) {
    console.error('データ取得エラー:', error);
    return;
  }

  if (!dailyRecords || dailyRecords.length === 0) {
    console.log('移行対象のdaily_recordsが見つかりませんでした。');
    return;
  }

  console.log(`移行対象: ${dailyRecords.length}件のdaily_records\n`);

  // サンプルを表示
  const sample = dailyRecords.slice(0, 5);
  for (const record of sample as DailyRecord[]) {
    console.log(`日付: ${record.date}`);
    console.log(`ユーザー: ${record.user_id.substring(0, 8)}...`);
    console.log(`do_text: ${record.do_text?.substring(0, 100)}...`);
    console.log('---');
  }

  if (dailyRecords.length > 5) {
    console.log(`... 他 ${dailyRecords.length - 5}件`);
  }
}

// コマンドライン引数で実行モードを切り替え
const args = process.argv.slice(2);
if (args.includes('--dry-run')) {
  dryRun().catch(console.error);
} else {
  migrate().catch(console.error);
}
