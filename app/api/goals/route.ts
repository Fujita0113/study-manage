import { NextRequest, NextResponse } from 'next/server';
import { getGoals, updateGoal, createGoalHistorySlot } from '@/lib/db';
import type { GoalChangeReason } from '@/types';

/**
 * GET /api/goals
 * 目標を取得するAPIエンドポイント
 */
export async function GET() {
  try {
    const goals = await getGoals();
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/goals
 * 目標を更新するAPIエンドポイント
 *
 * Request Body:
 * - bronze: Bronze目標の説明
 * - silver: Silver目標の説明
 * - gold: Gold目標の説明
 * - changeReason: 変更理由
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bronze, silver, gold, changeReason } = body;

    // バリデーション
    if (!bronze || !silver || !gold) {
      return NextResponse.json(
        { error: 'bronze, silver, and gold are required' },
        { status: 400 }
      );
    }

    // 1. Goalテーブルを更新
    await updateGoal('bronze', bronze.trim());
    await updateGoal('silver', silver.trim());
    await updateGoal('gold', gold.trim());

    // 2. 新しい目標履歴スロットを作成
    await createGoalHistorySlot(
      bronze.trim(),
      silver.trim(),
      gold.trim(),
      (changeReason as GoalChangeReason) || 'initial'
    );

    // 更新後の目標を取得して返す
    const updatedGoals = await getGoals();
    return NextResponse.json(updatedGoals);
  } catch (error) {
    console.error('Failed to update goals:', error);
    return NextResponse.json(
      { error: 'Failed to update goals' },
      { status: 500 }
    );
  }
}
