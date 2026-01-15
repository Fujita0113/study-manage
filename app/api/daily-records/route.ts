import { NextRequest, NextResponse } from 'next/server';
import { getDailyRecords, getDailyRecordByDate, createDailyRecord } from '@/lib/db';
import type { DailyRecord } from '@/types';

/**
 * GET /api/daily-records
 * 日次記録を取得するAPIエンドポイント
 *
 * Query Parameters:
 * - date: 特定の日付の記録を取得（YYYY-MM-DD形式）
 * - startDate: 開始日（YYYY-MM-DD形式）
 * - endDate: 終了日（YYYY-MM-DD形式）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 特定の日付の記録を取得
    if (date) {
      const record = await getDailyRecordByDate(date);
      return NextResponse.json(record);
    }

    // 期間指定で記録を取得
    const records = await getDailyRecords(undefined, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Failed to fetch daily records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily records' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-records
 * 日次記録を作成するAPIエンドポイント
 *
 * Request Body:
 * - date: 記録日（YYYY-MM-DD形式）
 * - achievementLevel: 達成度レベル
 * - doText: 学習内容（オプション）
 * - journalText: 日報テキスト（オプション）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, achievementLevel, doText, journalText } = body;

    // バリデーション
    if (!date || !achievementLevel) {
      return NextResponse.json(
        { error: 'date and achievementLevel are required' },
        { status: 400 }
      );
    }

    // 記録を作成
    const record = await createDailyRecord({
      date,
      achievementLevel,
      doText,
      journalText,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Failed to create daily record:', error);
    return NextResponse.json(
      { error: 'Failed to create daily record' },
      { status: 500 }
    );
  }
}
