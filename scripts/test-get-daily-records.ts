/**
 * getDailyRecords関数のテストスクリプト
 * 実行方法: npx tsx scripts/test-get-daily-records.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Database } from '@/lib/supabase/types';
import type { DailyRecord, AchievementLevel } from '@/types';

// .env.localファイルを読み込む
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  console.error('❌ .env.localファイルの読み込みに失敗しました');
  process.exit(1);
}

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

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

/**
 * getDailyRecords関数のテスト実装（Supabase直接接続版）
 */
async function getDailyRecords(
  userId: string,
  options?: { startDate?: string; endDate?: string }
): Promise<DailyRecord[]> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );

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
