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

    // goal_level_historyテーブルからレベル変更イベントを取得
    const { data: history, error } = await supabase
      .from('goal_level_history')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Error fetching goal level history:', error);
      return NextResponse.json({ error: 'Failed to fetch level changes' }, { status: 500 });
    }

    return NextResponse.json(history || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
