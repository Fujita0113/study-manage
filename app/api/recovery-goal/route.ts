import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { getRecoveryGoal, updateRecoveryGoal, getRecoveryModeStatus } from '@/lib/db';

/**
 * リカバリー目標を取得
 * GET /api/recovery-goal
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const goal = await getRecoveryGoal(user.id);

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('[API] Error getting recovery goal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * リカバリー目標を更新
 * PATCH /api/recovery-goal
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // リカバリーモード中は編集不可
    const status = await getRecoveryModeStatus(user.id);
    if (status.isActive) {
      return NextResponse.json(
        { error: 'Cannot edit recovery goal while recovery mode is active' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { goal } = body;

    // バリデーション
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return NextResponse.json(
        { error: 'Recovery goal must be a non-empty string' },
        { status: 400 }
      );
    }

    await updateRecoveryGoal(user.id, goal.trim());

    return NextResponse.json({
      message: 'Recovery goal updated successfully',
      goal: goal.trim()
    });
  } catch (error) {
    console.error('[API] Error updating recovery goal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
