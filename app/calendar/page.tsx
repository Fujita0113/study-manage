// カレンダー画面（実装計画書に従った実装）

import { AppLayout } from '@/components/layout/AppLayout';
import { getDailyRecords, calculateStreakFromRecords } from '@/lib/db';
import { formatDate, getDaysInMonth, getLevelColor, formatDateShort, getLevelLabel } from '@/lib/utils';
import { requireAuth } from '@/lib/auth/server';
import Link from 'next/link';

interface CalendarPageProps {
  searchParams?: Promise<{ year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();

  // URLパラメータから年月を取得（デフォルトは今月）
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const now = new Date();
  const currentYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : now.getFullYear();
  const currentMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : now.getMonth() + 1;

  // 月の日付リストを生成
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  // 該当月の記録を取得
  const startDate = formatDate(new Date(currentYear, currentMonth - 1, 1));
  const endDate = formatDate(new Date(currentYear, currentMonth, 0));
  const records = await getDailyRecords(user.id, { startDate, endDate });

  // 月の最初の曜日を取得（0: 日曜、1: 月曜...）
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  // 前月・次月のURLを生成
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  const prevUrl = `/calendar?year=${prevYear}&month=${prevMonth}`;
  const nextUrl = `/calendar?year=${nextYear}&month=${nextMonth}`;

  // ストリークを計算
  const streakDays = await calculateStreakFromRecords(user.id);

  return (
    <AppLayout pageTitle="カレンダー" streakDays={streakDays}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* 月選択 */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href={prevUrl}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← 前月
            </Link>
            <h2 className="text-xl font-semibold text-slate-800">
              {currentYear}年{currentMonth}月
            </h2>
            <Link
              href={nextUrl}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              次月 →
            </Link>
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-2">
            {/* 曜日ヘッダー */}
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
                {day}
              </div>
            ))}

            {/* 空白セル（月初めまで） */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24" />
            ))}

            {/* 日付セル */}
            {daysInMonth.map(date => {
              const dateStr = formatDate(date);
              const record = records.find(r => r.date === dateStr);
              const achievementLevel = record?.achievementLevel || 'none';
              const recoveryAchieved = record?.recoveryAchieved || false;
              const isToday = dateStr === formatDate(new Date());

              // ベース色ではなく完全にクラスで制御する
              let cellClasses = 'group relative h-24 rounded-lg p-2 transition-all ';
              let innerContent = null;

              if (achievementLevel === 'gold') {
                cellClasses += 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border-2 border-amber-500 shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 ring-1 ring-white/50 inset-0';
                innerContent = (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <span className="text-4xl text-amber-100">👑</span>
                  </div>
                );
              } else if (achievementLevel === 'silver') {
                cellClasses += 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border border-slate-400 shadow-md shadow-slate-400/30 hover:shadow-slate-400/50';
                innerContent = (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <span className="text-4xl text-slate-100">✨</span>
                  </div>
                );
              } else if (achievementLevel === 'bronze') {
                cellClasses += 'bg-[#CD7F32] border border-[#a66628] hover:shadow-md';
              } else {
                cellClasses += 'bg-[#F3F4F6] border border-gray-200 hover:border-blue-500 hover:shadow-md';
              }

              return (
                <Link
                  key={dateStr}
                  href={`/day/${dateStr}`}
                  className={cellClasses}
                >
                  {innerContent}
                  <div className="relative flex items-start justify-between z-10">
                    <span className={`text-sm font-medium ${achievementLevel === 'gold' || achievementLevel === 'bronze' ? 'text-white' : 'text-slate-700'}`}>
                      {date.getDate()}
                    </span>
                    <div className="flex items-center gap-1">
                      {recoveryAchieved && (
                        <span className="text-sm drop-shadow-sm" title="リカバリー達成">♥️</span>
                      )}
                      {achievementLevel === 'gold' && !recoveryAchieved && (
                        <span className="text-sm drop-shadow-sm" title="Gold達成">👑</span>
                      )}
                      {achievementLevel === 'silver' && !recoveryAchieved && (
                        <span className="text-sm drop-shadow-sm" title="Silver達成">✨</span>
                      )}
                      {isToday && (
                        <span className={`w-2 h-2 rounded-full ${achievementLevel === 'gold' || achievementLevel === 'bronze' ? 'bg-white' : 'bg-blue-600'}`}></span>
                      )}
                    </div>
                  </div>

                  {/* ホバーツールチップ */}
                  {record && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      <div className="font-semibold">{formatDateShort(dateStr)}</div>
                      <div className="mt-1 font-medium">
                        達成度: {achievementLevel === 'gold' ? '👑 ' : ''}{getLevelLabel(achievementLevel)}
                        {recoveryAchieved && ' + ♥️リカバリー'}
                      </div>
                      {record.journalText && (
                        <div className="mt-1 max-w-xs truncate">
                          {record.journalText.substring(0, 40)}
                          {record.journalText.length > 40 && '...'}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* 凡例 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-slate-700 mb-3">凡例</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 font-semibold">
                <div className="w-6 h-6 rounded shadow-sm shadow-amber-500/40 border-2 border-amber-500 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center">
                  <span className="text-[10px] text-white">👑</span>
                </div>
                <span className="text-sm text-slate-800">Gold (最高)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded shadow-sm shadow-slate-400/30 border border-slate-400 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center">
                  <span className="text-[10px]">✨</span>
                </div>
                <span className="text-sm text-slate-600">Silver</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-[#a66628] bg-[#CD7F32]" />
                <span className="text-sm text-slate-600">Bronze</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">♥️</span>
                <span className="text-sm text-slate-600">リカバリー達成</span>
              </div>
              <div className="flex items-center gap-2 opacity-70">
                <div className="w-6 h-6 rounded bg-[#F3F4F6] border border-gray-200" />
                <span className="text-sm text-slate-500">未記録</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}



