/**
 * データベースに初期データを投入するスクリプト
 * 実行方法: npx tsx scripts/seed-database.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = 'test-user-001';

async function seed() {
  console.log('データベースに初期データを投入します...\n');

  // 1. User Settings
  console.log('1. User Settings を作成中...');
  const { error: userError } = await supabase
    .from('user_settings')
    .upsert({
      id: USER_ID,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    });

  if (userError) {
    console.error('User Settings エラー:', userError);
  } else {
    console.log('✓ User Settings 作成完了');
  }

  // 2. Goals
  console.log('\n2. Goals を作成中...');
  const goals = [
    { level: 'bronze', description: '30分だけプログラミングする' },
    { level: 'silver', description: '1つの機能を完成させる' },
    { level: 'gold', description: 'リファクタリングまで完了させる' },
  ];

  for (const goal of goals) {
    const { error } = await supabase
      .from('goals')
      .upsert({
        user_id: USER_ID,
        level: goal.level,
        description: goal.description,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`Goal (${goal.level}) エラー:`, error);
    } else {
      console.log(`✓ Goal (${goal.level}) 作成完了`);
    }
  }

  // 3. Streak
  console.log('\n3. Streak を作成中...');
  const { error: streakError } = await supabase
    .from('streaks')
    .upsert({
      user_id: USER_ID,
      current_streak: 0,
      longest_streak: 0,
      last_recorded_date: null,
      updated_at: new Date().toISOString(),
    });

  if (streakError) {
    console.error('Streak エラー:', streakError);
  } else {
    console.log('✓ Streak 作成完了');
  }

  // 4. Goal History
  console.log('\n4. Goal History を作成中...');
  const { error: historyError } = await supabase
    .from('goal_history')
    .upsert({
      user_id: USER_ID,
      bronze_goal: '30分だけプログラミングする',
      silver_goal: '1つの機能を完成させる',
      gold_goal: 'リファクタリングまで完了させる',
      start_date: '2025-01-01',
      end_date: null,
      change_reason: 'initial',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    });

  if (historyError) {
    console.error('Goal History エラー:', historyError);
  } else {
    console.log('✓ Goal History 作成完了');
  }

  // 5. Daily Records (サンプル)
  console.log('\n5. Daily Records (サンプル) を作成中...');
  const dailyRecords = [
    { date: '2025-01-01', achievement_level: 'bronze', do_text: '30分学習', journal_text: '初日' },
    { date: '2025-01-02', achievement_level: 'silver', do_text: '機能実装', journal_text: '順調' },
    { date: '2025-01-03', achievement_level: 'gold', do_text: 'リファクタ完了', journal_text: '完璧' },
  ];

  for (const record of dailyRecords) {
    const { error } = await supabase
      .from('daily_records')
      .upsert({
        user_id: USER_ID,
        ...record,
        created_at: `${record.date}T00:00:00Z`,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`Daily Record (${record.date}) エラー:`, error);
    } else {
      console.log(`✓ Daily Record (${record.date}) 作成完了`);
    }
  }

  console.log('\n✅ 初期データの投入が完了しました！');
}

seed().catch(console.error);
