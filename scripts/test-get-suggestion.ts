/**
 * getSuggestion関数のテストスクリプト
 * 実行方法: npx tsx scripts/test-get-suggestion.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Database } from '@/lib/supabase/types';
import type { DailyRecord, AchievementLevel, Suggestion } from '@/types';

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

/**
 * getSuggestion関数のテスト実装
 */
async function getSuggestion(userId: string): Promise<Suggestion | null> {
  // Check for level up suggestion (14 consecutive days at same level)
  const records = await getDailyRecords(userId);
  const recentRecords = records.slice(0, 14);

  // Check Gold level up
  const allGold = recentRecords.every((r) => r.achievementLevel === 'gold');
  if (allGold && recentRecords.length === 14) {
    return {
      type: 'level_up',
      message: 'Goldレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'gold',
      canEditAllGoals: false,
    };
  }

  // Check Silver level up
  const allSilver = recentRecords.every((r) => r.achievementLevel === 'silver');
  if (allSilver && recentRecords.length === 14) {
    return {
      type: 'level_up',
      message: 'Silverレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'silver',
      canEditAllGoals: false,
    };
  }

  // Check Bronze level up
  const allBronze = recentRecords.every((r) => r.achievementLevel === 'bronze');
  if (allBronze && recentRecords.length === 14) {
    return {
      type: 'level_up',
      message: 'Bronzeレベルを14日連続達成しました！目標をレベルアップしませんか？',
      targetLevel: 'bronze',
      canEditAllGoals: false,
    };
  }

  // Check level down suggestion (failed to achieve Bronze 4+ days in a week)
  const lastWeek = records.slice(0, 7);
  const failedDays = lastWeek.filter((r) => r.achievementLevel === 'none').length;
  if (failedDays >= 4) {
    return {
      type: 'level_down',
      message: '目標をレベルダウンしませんか？無理のないペースで続けることが大切です。',
      canEditAllGoals: true,
    };
  }

  return null;
}

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
