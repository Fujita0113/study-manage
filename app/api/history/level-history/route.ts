import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { eachDayOfInterval, parseISO, formatISO } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // goal_level_historyテーブルからレベル履歴を取得
    const { data: history, error } = await supabase
      .from('goal_level_history')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Error fetching goal level history:', error);
      return NextResponse.json({ error: 'Failed to fetch level history' }, { status: 500 });
    }

    if (!history || history.length === 0) {
      return NextResponse.json([]);
    }

    // 全期間の開始日と終了日を取得
    const firstDate = parseISO(history[0].started_at.split('T')[0]);
    const lastEntry = history[history.length - 1];
    const lastDate = lastEntry.ended_at
      ? parseISO(lastEntry.ended_at.split('T')[0])
      : new Date();

    // 日ごとのデータを生成
    const allDays = eachDayOfInterval({ start: firstDate, end: lastDate });

    const levelHistoryData = allDays.map(day => {
      const dateStr = formatISO(day, { representation: 'date' });

      // その日に有効だった各目標レベルを検索
      const bronzeEntry = history.find(
        h =>
          h.goal_type === 'bronze' &&
          h.started_at.split('T')[0] <= dateStr &&
          (!h.ended_at || h.ended_at.split('T')[0] >= dateStr)
      );
      const silverEntry = history.find(
        h =>
          h.goal_type === 'silver' &&
          h.started_at.split('T')[0] <= dateStr &&
          (!h.ended_at || h.ended_at.split('T')[0] >= dateStr)
      );
      const goldEntry = history.find(
        h =>
          h.goal_type === 'gold' &&
          h.started_at.split('T')[0] <= dateStr &&
          (!h.ended_at || h.ended_at.split('T')[0] >= dateStr)
      );

      return {
        date: dateStr,
        bronze: bronzeEntry?.level || 0,
        silver: silverEntry?.level || 0,
        gold: goldEntry?.level || 0,
        bronzeContent: bronzeEntry?.goal_content || '',
        silverContent: silverEntry?.goal_content || '',
        goldContent: goldEntry?.goal_content || '',
      };
    });

    return NextResponse.json(levelHistoryData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
