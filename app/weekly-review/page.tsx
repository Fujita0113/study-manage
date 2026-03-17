import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { startOfWeek, format, parseISO, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

import {
    getDifficultyMemosAction,
    getGoldValidityAlertsAction,
    getGoalChangeMemoAction,
    getWeeklyReviewStatusAction,
    completeWeeklyReviewAction,
} from '@/lib/actions/weekly';
import { getGoalsAction } from '@/lib/actions';
import { DifficultyMemoList } from './components/DifficultyMemoList';
import { GoalEditSection } from './components/GoalEditSection';
import { GoalChangeMemoBox } from './components/GoalChangeMemoBox';
import { GoldValidityAlerts } from './components/GoldValidityAlerts';
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
    const weekEndDate = addDays(weekStartDate, 6);
    const displayWeekRange = `${format(weekStartDate, 'M月d日', { locale: ja })} 〜 ${format(weekEndDate, 'M月d日', { locale: ja })}`;

    // 今日が月曜日かどうか
    const today = new Date();
    const isMonday = today.getDay() === 1;

    // データ取得
    const [
        difficultyMemos,
        goldAlerts,
        goals,
        memo,
        reviewStatus,
        streakDays
    ] = await Promise.all([
        getDifficultyMemosAction(user.id, weekStartDateStr),
        getGoldValidityAlertsAction(user.id),
        getGoalsAction(user.id),
        getGoalChangeMemoAction(user.id, weekStartDateStr),
        getWeeklyReviewStatusAction(user.id, weekStartDateStr),
        calculateStreakFromRecords(user.id)
    ]);

    // 振り返り完了アクション（Server Action）
    async function handleCompleteReview() {
        'use server';
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await completeWeeklyReviewAction(user.id, weekStartDateStr);
        redirect('/');
    }

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
                    {displayWeekRange} の振り返り
                </p>
                {reviewStatus.isCompleted && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                        <span>✅</span>
                        <span>この週の振り返りは完了済みです</span>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {/* セクション1: 今週の難易度メモ */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        今週の難易度メモ
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        日々の記録画面で入力した難易度メモの一覧です。目標チューニングの参考にしてください。
                    </p>
                    <DifficultyMemoList memos={difficultyMemos} />
                </section>

                {/* セクション2: 目標のチューニング */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        目標のチューニング
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        メモを参考に、自分の感覚で目標の難易度を調整しましょう。
                    </p>

                    {!isMonday && (
                        <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 flex items-start gap-2">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-medium">Bronze/Silver目標の変更は毎週月曜日に行えます</p>
                                <p className="mt-1 text-blue-600 text-xs">Gold目標はいつでも編集可能です。</p>
                            </div>
                        </div>
                    )}

                    <GoalEditSection
                        goals={goals}
                        isMonday={isMonday}
                        userId={user.id}
                    />
                </section>

                {/* セクション3: Gold目標の妥当性チェック */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        Gold目標の妥当性チェック
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Gold目標が努力目標として正しく機能しているか、システムがチェックした結果です。
                    </p>
                    <GoldValidityAlerts alerts={goldAlerts} />
                </section>

                {/* 振り返り完了ボタン */}
                {!reviewStatus.isCompleted && (
                    <div className="flex justify-center pt-4">
                        <form action={handleCompleteReview}>
                            <button
                                type="submit"
                                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 text-lg flex items-center gap-2"
                            >
                                <span>✅</span>
                                振り返り完了
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
