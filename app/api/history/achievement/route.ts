import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // daily_recordsテーブルから達成状況を取得
    const { data: records, error } = await supabase
      .from('daily_records')
      .select('date, achievement_level')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching records:', error);
      return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }

    // 達成レベルを数値に変換
    const achievementData = records.map(record => {
      let level = 0;
      if (record.achievement_level === 'bronze') level = 1;
      else if (record.achievement_level === 'silver') level = 2;
      else if (record.achievement_level === 'gold') level = 3;

      return {
        date: record.date,
        level,
      };
    });

    return NextResponse.json(achievementData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
