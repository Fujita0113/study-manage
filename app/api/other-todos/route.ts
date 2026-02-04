/**
 * Other Todos API
 * その他TODO一覧取得・追加
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOtherTodos, createOtherTodo } from '@/lib/db';

/**
 * GET /api/other-todos
 * ユーザーのその他TODO一覧取得（アーカイブ除く）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true';
    const todos = await getOtherTodos(user.id, includeArchived);

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Failed to get other todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/other-todos
 * その他TODOを追加
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body: content required' },
        { status: 400 }
      );
    }

    const todo = await createOtherTodo(user.id, content.trim());

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Failed to create other todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
