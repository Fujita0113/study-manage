/**
 * テストデータ存在確認スクリプト
 * 実行方法: npx tsx scripts/test-mock-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
