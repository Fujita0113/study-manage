import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { startOfWeek, format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

import { getWeeklyReviewSummaryAction, getTodoAnalysisAction, getGoalChangeMemoAction, checkAndCreateAccessLogAction } from '@/lib/actions/weekly';
import { getGoalsAction } from '@/lib/actions';
import { WeeklySummary } from './components/WeeklySummary';
import { TodoAnalysis } from './components/TodoAnalysis';
import { GoalEditSection } from './components/GoalEditSection';
import { GoalChangeMemoBox } from './components/GoalChangeMemoBox';
import { AppLayout } from '@/components/layout/AppLayout';
import { calculateStreakFromRecords } from '@/lib/db';

export const metadata = {
    title: '週次振り返り - Pepper Dev Journal',
};

export default async function WeeklyReviewPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // searchParams is a Promise in Next.js 15
    const resolvedParams = await searchParams;
    const weekParam = typeof resolvedParams.week === 'string' ? resolvedParams.week : null;

    // 週の開始日（月曜日始まり）
    let weekStartDate: Date;
    if (weekParam) {
        weekStartDate = parseISO(weekParam);
    } else {
        weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    }

    const weekStartDateStr = format(weekStartDate, 'yyyy-MM-dd');
    const displayWeekRange = `${format(weekStartDate, 'MM月dd日')} 〜 ${format(new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000), 'MM月dd日')}`;

    // データ取得
    const [
        summary,
        todoAnalysis,
        goals,
        accessLog,
        memo,
        streakDays
    ] = await Promise.all([
        getWeeklyReviewSummaryAction(user.id, weekStartDateStr),
        getTodoAnalysisAction(user.id, weekStartDateStr),
        getGoalsAction(user.id),
        checkAndCreateAccessLogAction(user.id, weekStartDateStr),
        getGoalChangeMemoAction(user.id, weekStartDateStr),
        calculateStreakFromRecords(user.id)
    ]);

    return (
        <AppLayout
            pageTitle="週次振り返り"
            streakDays={streakDays}
        >
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    週次振り返り
                </h1>
                <p className="text-slate-500 mt-1">
                    {displayWeekRange} の成果と次のステップ
                </p>
            </div>

            <div className="space-y-8">
                {/* 週次サマリー */}
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        今週のサマリー
                    </h2>
                    <WeeklySummary summary={summary} />
                </section>

                {/* TODO別達成状況分析 */}
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        TODO別達成状況
                    </h2>
                    <TodoAnalysis analysis={todoAnalysis} />
                </section>

                {/* 目標の調整セクション */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🧗</span>
                        目標の調整
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <GoalEditSection
                                goals={goals}
                                canEditSilverBronze={accessLog.canEdit}
                                userId={user.id}
                            />
                            {!accessLog.canEdit && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100 flex items-start gap-2">
                                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        Silver / Bronze目標は、週の初回の振り返り時のみ変更可能です。<br />変更解禁日: {format(parseISO(accessLog.existingLog?.editUnlockDate || ''), 'yyyy年MM月dd日')}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            {/* チェンジメモ */}
                            <GoalChangeMemoBox
                                memo={memo?.content || ''}
                                weekStartDate={weekStartDateStr}
                                userId={user.id}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
