/**
 * Goal Todos API
 * 指定した目標に紐づくTODOの取得・追加・更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoalTodos, createGoalTodos, updateGoalTodos } from '@/lib/db';

/**
 * GET /api/goals/[goalId]/todos
 * 指定したgoal_idに紐づくTODOリストを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await params;
    const todos = await getGoalTodos(goalId);

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Failed to get goal todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/goals/[goalId]/todos
 * 指定したgoal_idにTODOを追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await params;
    const body = await request.json();
    const { todos } = body as { todos: string[] };

    if (!todos || !Array.isArray(todos) || todos.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body: todos array required' },
        { status: 400 }
      );
    }

    const createdTodos = await createGoalTodos(goalId, todos);

    return NextResponse.json(createdTodos, { status: 201 });
  } catch (error) {
    console.error('Failed to create goal todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/goals/[goalId]/todos
 * 指定したgoal_idのTODOを一括更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await params;
    const body = await request.json();
    const { todos } = body as { todos: { id?: string; content: string }[] };

    if (!todos || !Array.isArray(todos)) {
      return NextResponse.json(
        { error: 'Invalid request body: todos array required' },
        { status: 400 }
      );
    }

    const updatedTodos = await updateGoalTodos(goalId, todos);

    return NextResponse.json(updatedTodos);
  } catch (error) {
    console.error('Failed to update goal todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
