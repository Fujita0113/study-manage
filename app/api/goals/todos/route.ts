/**
 * Goal Todos API
 * ユーザーの全目標のTODO一覧取得（レベル別にグループ化）
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoalTodosByUserId } from '@/lib/db';

/**
 * GET /api/goals/todos
 * ユーザーの全目標のTODOをレベル別に取得
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todosByLevel = await getGoalTodosByUserId(user.id);

    return NextResponse.json(todosByLevel);
  } catch (error) {
    console.error('Failed to get goal todos by user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
