/**
 * Supabase接続テストスクリプト
 * 実行方法: npx tsx scripts/test-supabase-connection.ts
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

async function testConnection() {
  console.log('🔍 Supabase接続テストを開始...\n');

  // 環境変数の確認
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 環境変数が設定されていません');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
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
