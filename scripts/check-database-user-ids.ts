/**
 * Supabaseデータベースに存在するuser_idを確認するスクリプト
 * 実行方法: npx tsx scripts/check-database-user-ids.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.localファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const EXPECTED_USER_ID = '00000000-0000-0000-0000-000000000001';

async function checkUserIds() {
  console.log('🔍 データベースのuser_id確認を開始...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 環境変数が設定されていません');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. user_settingsテーブルのuser_id確認
  console.log('📋 1. user_settingsテーブルの確認...');
  const { data: userSettings, error: userError } = await supabase
    .from('user_settings')
    .select('id, created_at');

  if (userError) {
    console.error('❌ エラー:', userError.message);
  } else if (!userSettings || userSettings.length === 0) {
    console.log('⚠️  データが存在しません');
  } else {
    console.log(`✅ ${userSettings.length}件のユーザーが見つかりました:`);
    userSettings.forEach((user) => {
      const match = user.id === EXPECTED_USER_ID ? '✅ 一致' : '⚠️ 不一致';
      console.log(`   - ${user.id} ${match}`);
    });
  }

  // 2. daily_recordsテーブルのuser_id確認
  console.log('\n📋 2. daily_recordsテーブルの確認...');
  const { data: records, error: recordsError } = await supabase
    .from('daily_records')
    .select('user_id, date, achievement_level')
    .order('date', { ascending: false })
    .limit(5);

  if (recordsError) {
    console.error('❌ エラー:', recordsError.message);
  } else if (!records || records.length === 0) {
    console.log('⚠️  データが存在しません');
    console.log('\n❌ 重要: daily_recordsテーブルにデータが存在しません！');
    console.log('対策: テストデータを投入する必要があります。');
  } else {
    console.log(`✅ ${records.length}件の記録が見つかりました（最新5件）:`);

    // user_idのユニークな値を抽出
    const uniqueUserIds = [...new Set(records.map(r => r.user_id))];
    console.log(`\n   ユニークなuser_id: ${uniqueUserIds.length}件`);

    uniqueUserIds.forEach((userId) => {
      const match = userId === EXPECTED_USER_ID ? '✅ 一致' : '⚠️ 不一致';
      console.log(`   - ${userId} ${match}`);
    });

    console.log('\n   最新5件の記録:');
    records.forEach((record) => {
      console.log(`   - ${record.date}: ${record.achievement_level} (user: ${record.user_id.substring(0, 8)}...)`);
    });
  }

  // 3. 期待されるuser_idのデータ件数確認
  console.log(`\n📋 3. 期待されるuser_id (${EXPECTED_USER_ID}) のデータ件数確認...`);
  const { count, error: countError } = await supabase
    .from('daily_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', EXPECTED_USER_ID);

  if (countError) {
    console.error('❌ エラー:', countError.message);
  } else {
    if (count === 0) {
      console.log('❌ データが存在しません！');
      console.log('\n原因判明: 期待されるuser_idのデータがデータベースに存在しません。');
      console.log('対策: テストデータ投入スクリプトを実行する必要があります。');
    } else {
      console.log(`✅ ${count}件のデータが存在します`);
    }
  }

  console.log('\n✨ 調査完了');
}

checkUserIds();
