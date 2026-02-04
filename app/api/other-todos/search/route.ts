/**
 * Other Todos Search API
 * オートコンプリート用検索（アーカイブ含む）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchOtherTodos } from '@/lib/db';

/**
 * GET /api/other-todos/search
 * その他TODOを検索（オートコンプリート用）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get('q') || '';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    const todos = await searchOtherTodos(user.id, query.trim(), limit);

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Failed to search other todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
