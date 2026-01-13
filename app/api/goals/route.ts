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

    console.log('PUT /api/goals - Request body:', { bronze, silver, gold, changeReason });

    // バリデーション
    if (!bronze || !silver || !gold) {
      return NextResponse.json(
        { error: 'bronze, silver, and gold are required' },
        { status: 400 }
      );
    }

    // 1. Goalテーブルを更新
    console.log('Updating bronze goal...');
    await updateGoal('bronze', bronze.trim());
    console.log('Bronze goal updated successfully');

    console.log('Updating silver goal...');
    await updateGoal('silver', silver.trim());
    console.log('Silver goal updated successfully');

    console.log('Updating gold goal...');
    await updateGoal('gold', gold.trim());
    console.log('Gold goal updated successfully');

    // 2. 新しい目標履歴スロットを作成
    console.log('Creating goal history slot...');
    await createGoalHistorySlot(
      bronze.trim(),
      silver.trim(),
      gold.trim(),
      (changeReason as GoalChangeReason) || 'initial'
    );
    console.log('Goal history slot created successfully');

    // 更新後の目標を取得して返す
    const updatedGoals = await getGoals();
    return NextResponse.json(updatedGoals);
  } catch (error) {
    console.error('Failed to update goals:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to update goals', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
