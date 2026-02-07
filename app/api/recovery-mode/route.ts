import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import {
  getRecoveryModeStatus,
  activateRecoveryMode,
  deactivateRecoveryMode,
  getRecoveryGoal,
  getDailyRecordByDate,
} from '@/lib/db';
import { formatDate } from '@/lib/utils';

/**
 * リカバリーモードの状態を取得
 * GET /api/recovery-mode
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

    const status = await getRecoveryModeStatus(user.id);

    return NextResponse.json(status);
  } catch (error) {
    console.error('[API] Error getting recovery mode status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * リカバリーモードを起動
 * POST /api/recovery-mode
 */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 既にリカバリーモードが起動中かチェック
    const currentStatus = await getRecoveryModeStatus(user.id);
    if (currentStatus.isActive) {
      return NextResponse.json(
        { error: 'Recovery mode is already active' },
        { status: 400 }
      );
    }

    // リカバリー目標が設定されているかチェック
    const goal = await getRecoveryGoal(user.id);
    if (!goal) {
      return NextResponse.json(
        { error: 'Recovery goal is not set. Please set a recovery goal first.' },
        { status: 400 }
      );
    }

    // 今日の記録が既に確定済みかチェック
    const today = formatDate(new Date());
    const todayRecord = await getDailyRecordByDate(today, user.id);
    if (todayRecord) {
      return NextResponse.json(
        { error: 'Today\'s record is already locked. Cannot start recovery mode.' },
        { status: 400 }
      );
    }

    // リカバリーモードを起動
    await activateRecoveryMode(user.id);

    const newStatus = await getRecoveryModeStatus(user.id);

    return NextResponse.json({
      message: 'Recovery mode activated successfully',
      ...newStatus
    });
  } catch (error) {
    console.error('[API] Error activating recovery mode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * リカバリーモードを解除
 * DELETE /api/recovery-mode
 */
export async function DELETE() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deactivateRecoveryMode(user.id);

    return NextResponse.json({
      message: 'Recovery mode deactivated successfully'
    });
  } catch (error) {
    console.error('[API] Error deactivating recovery mode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
