/**
 * Daily Todo Records API
 * 日次TODO達成記録の取得・保存
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDailyTodoRecords, saveDailyTodoRecords } from '@/lib/db';

/**
 * GET /api/daily-records/[recordId]/todos
 * 日次TODO達成記録を取得（goal_todos, other_todosの情報を含む）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recordId } = await params;

    // TODO達成記録を取得
    const { data, error } = await supabase
      .from('daily_todo_records')
      .select('*')
      .eq('daily_record_id', recordId);

    if (error) {
      console.error('Failed to fetch daily todo records:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // 型を整形して返す
    const records = (data || []).map((record: any) => ({
      id: record.id,
      todoType: record.todo_type as 'goal' | 'other',
      todoId: record.todo_id,
      isAchieved: record.is_achieved,
    }));

    return NextResponse.json(records);
  } catch (error) {
    console.error('Failed to get daily todo records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-records/[recordId]/todos
 * 日次TODO達成記録を保存
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recordId } = await params;
    const body = await request.json();
    const { records } = body as {
      records: { todoType: 'goal' | 'other'; todoId: string; isAchieved: boolean }[];
    };

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Invalid request body: records array required' },
        { status: 400 }
      );
    }

    await saveDailyTodoRecords(recordId, records);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save daily todo records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
