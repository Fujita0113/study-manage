import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTimelineTodosAction } from '@/lib/actions/timeline';

/**
 * GET /api/timeline-todos
 * ユーザーの有効な（削除されていない）マイルーティン一覧を取得
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const allTodos = await getTimelineTodosAction(user.id);
        // 削除されていないものだけを返す
        const activeTodos = allTodos.filter(todo => !todo.isDeleted);

        return NextResponse.json(activeTodos);
    } catch (error) {
        console.error('Failed to get timeline todos:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
