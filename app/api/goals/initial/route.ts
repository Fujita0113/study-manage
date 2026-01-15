import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { createInitialGoals } from '@/lib/db';

/**
 * 初期目標を一括保存するAPI
 * POST /api/goals/initial
 */
export async function POST(request: NextRequest) {
  console.log('[API] /api/goals/initial - Start');

  try {
    // 1. 認証チェック
    console.log('[API] Getting user...');
    const user = await getUser();
    if (!user) {
      console.log('[API] User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('[API] User authenticated:', user.id);

    // 2. リクエストボディを取得
    console.log('[API] Parsing request body...');
    const body = await request.json();
    const { bronze, silver, gold } = body;
    console.log('[API] Request body:', { bronze, silver, gold });

    // 3. バリデーション
    if (!bronze || !silver || !gold) {
      console.log('[API] Validation failed: missing goals');
      return NextResponse.json(
        { error: 'Bronze, Silver, Gold goals are required' },
        { status: 400 }
      );
    }

    if (typeof bronze !== 'string' || bronze.trim().length === 0) {
      console.log('[API] Validation failed: invalid bronze goal');
      return NextResponse.json(
        { error: 'Bronze goal must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof silver !== 'string' || silver.trim().length === 0) {
      console.log('[API] Validation failed: invalid silver goal');
      return NextResponse.json(
        { error: 'Silver goal must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof gold !== 'string' || gold.trim().length === 0) {
      console.log('[API] Validation failed: invalid gold goal');
      return NextResponse.json(
        { error: 'Gold goal must be a non-empty string' },
        { status: 400 }
      );
    }

    // 4. 初期目標を作成
    console.log('[API] Creating initial goals...');
    const startTime = Date.now();
    await createInitialGoals(
      bronze.trim(),
      silver.trim(),
      gold.trim(),
      user.id
    );
    const createTime = Date.now() - startTime;
    console.log(`[API] Goals created successfully (took ${createTime}ms)`);

    // 5. 保存後の確認：実際にデータベースに保存されたか確認（リトライロジック付き）
    console.log('[API] Verifying goals were saved...');
    const verifyStartTime = Date.now();
    const { createClient } = await import('@/lib/supabase/server');
    const verifySupabase = await createClient();
    
    // 最大3回までリトライ（指数バックオフ）
    let savedGoals = null;
    let verifyError = null;
    let verifyAttempt = 0;
    
    for (let attempt = 0; attempt < 3; attempt++) {
      verifyAttempt = attempt + 1;
      console.log(`[API] Verification attempt ${verifyAttempt}/3...`);
      
      const { data, error } = await verifySupabase
        .from('goals')
        .select('id, level, description, created_at')
        .eq('user_id', user.id)
        .order('level', { ascending: true });
      
      if (!error && data && data.length === 3) {
        savedGoals = data;
        console.log(`[API] Verification successful on attempt ${verifyAttempt}`);
        break;
      }
      
      if (error) {
        console.warn(`[API] Verification attempt ${verifyAttempt} failed with error:`, error);
        verifyError = error;
      } else if (!data || data.length !== 3) {
        console.warn(`[API] Verification attempt ${verifyAttempt} failed: expected 3 goals, got ${data?.length || 0}`);
      }
      
      // 最後の試行でない場合は待機
      if (attempt < 2) {
        const waitTime = 50 * Math.pow(2, attempt); // 50ms, 100ms
        console.log(`[API] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    const verifyTime = Date.now() - verifyStartTime;
    
    // 検証が失敗した場合はエラーを返す
    if (verifyError || !savedGoals || savedGoals.length !== 3) {
      console.error(`[API] Goals verification failed after ${verifyAttempt} attempts (took ${verifyTime}ms):`, {
        error: verifyError,
        goalsCount: savedGoals?.length || 0,
        goals: savedGoals?.map(g => ({ level: g.level, id: g.id }))
      });
      return NextResponse.json(
        { 
          error: 'Failed to verify goals were saved. Please try again.',
          details: verifyError ? verifyError.message : `Expected 3 goals, got ${savedGoals?.length || 0}`
        },
        { status: 500 }
      );
    }
    
    console.log(`[API] Verification complete (took ${verifyTime}ms, ${verifyAttempt} attempts):`, {
      count: savedGoals.length,
      goals: savedGoals.map(g => ({ level: g.level, id: g.id, created_at: g.created_at }))
    });

    // 6. 成功レスポンス
    const totalTime = Date.now() - startTime;
    console.log(`[API] Total processing time: ${totalTime}ms`);
    return NextResponse.json(
      { 
        message: 'Goals created successfully',
        goalsCount: savedGoals.length,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error creating initial goals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
