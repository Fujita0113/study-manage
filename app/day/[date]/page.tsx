// 日詳細画面（シンプル版）

import { AppLayout } from '@/components/layout/AppLayout';
import { getDailyRecordByDate, calculateStreakFromRecords } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import {
  formatDateJP,
  getLevelLabel,
  getLevelBadgeClass
} from '@/lib/utils';
import Link from 'next/link';

interface DayDetailPageProps {
  params: Promise<{ date: string }> | { date: string };
}

export default async function DayDetailPage({ params }: DayDetailPageProps) {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();

  // Next.js 15対応: paramsがPromiseの場合はawaitする
  const resolvedParams = 'then' in params ? await params : params;
  const { date } = resolvedParams;

  // 日付の記録を取得
  const record = await getDailyRecordByDate(date, user.id);

  // ストリークを計算
  const streakDays = await calculateStreakFromRecords(user.id);

  if (!record) {
    return (
      <AppLayout pageTitle="日詳細" streakDays={streakDays}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {formatDateJP(date)} の記録
            </h2>
            <p className="text-sm text-slate-500">この日の記録はありません</p>
            <Link
              href="/calendar"
              className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              ← カレンダーに戻る
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle={`${formatDateJP(date)} の記録`} streakDays={streakDays}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ナビゲーション */}
        <div>
          <Link
            href="/calendar"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← カレンダーに戻る
          </Link>
        </div>

        {/* 日付 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800">{formatDateJP(date)}</h2>
        </div>

        {/* 達成度 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">達成度</h2>
          <span
            className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${getLevelBadgeClass(
              record.achievementLevel
            )}`}
          >
            {getLevelLabel(record.achievementLevel)}
          </span>
        </div>

        {/* 学習内容サマリー */}
        {record.doText && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">学習内容サマリー</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{record.doText}</p>
          </div>
        )}

        {/* 自由記述（Journal） */}
        {record.journalText && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">自由記述</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{record.journalText}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
