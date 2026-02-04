/**
 * Other Todo API
 * その他TODOのアーカイブ/復活
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { archiveOtherTodo, unarchiveOtherTodo } from '@/lib/db';

/**
 * PATCH /api/other-todos/[todoId]
 * その他TODOをアーカイブ/復活
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { todoId } = await params;
    const body = await request.json();
    const { isArchived } = body as { isArchived: boolean };

    if (typeof isArchived !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body: isArchived boolean required' },
        { status: 400 }
      );
    }

    const todo = isArchived
      ? await archiveOtherTodo(todoId)
      : await unarchiveOtherTodo(todoId);

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Failed to update other todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
