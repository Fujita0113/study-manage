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
 * - editableGoals: 編集可能な目標レベルのリスト
 * - changeReason: 変更理由
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bronze, silver, gold, editableGoals, changeReason } = body;

    console.log('PUT /api/goals - Request body:', { bronze, silver, gold, editableGoals, changeReason });

    // バリデーション
    if (!bronze || !silver || !gold) {
      return NextResponse.json(
        { error: 'bronze, silver, and gold are required' },
        { status: 400 }
      );
    }

    if (!editableGoals || !Array.isArray(editableGoals)) {
      return NextResponse.json(
        { error: 'editableGoals is required and must be an array' },
        { status: 400 }
      );
    }

    // 1. Goalテーブルを更新（編集可能な目標のみ）
    const updatedGoals: string[] = [];

    if (editableGoals.includes('bronze')) {
      console.log('Updating bronze goal...');
      try {
        await updateGoal('bronze', bronze.trim());
        console.log('Bronze goal updated successfully');
        updatedGoals.push('bronze');
      } catch (error) {
        console.error('Failed to update bronze goal:', error);
        throw error;
      }
    } else {
      console.log('Skipping bronze goal update (not editable)');
    }

    if (editableGoals.includes('silver')) {
      console.log('Updating silver goal...');
      try {
        await updateGoal('silver', silver.trim());
        console.log('Silver goal updated successfully');
        updatedGoals.push('silver');
      } catch (error) {
        console.error('Failed to update silver goal:', error);
        throw error;
      }
    } else {
      console.log('Skipping silver goal update (not editable)');
    }

    if (editableGoals.includes('gold')) {
      console.log('Updating gold goal...');
      try {
        await updateGoal('gold', gold.trim());
        console.log('Gold goal updated successfully');
        updatedGoals.push('gold');
      } catch (error) {
        console.error('Failed to update gold goal:', error);
        throw error;
      }
    } else {
      console.log('Skipping gold goal update (not editable)');
    }

    console.log('Updated goals:', updatedGoals);

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
    const latestGoals = await getGoals();
    return NextResponse.json(latestGoals);
  } catch (error) {
    console.error('Failed to update goals:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to update goals', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
