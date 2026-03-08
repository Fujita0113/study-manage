'use client';

import type { WeeklyReviewSummary } from '@/types';

interface WeeklySummaryProps {
    summary: WeeklyReviewSummary;
}

export function WeeklySummary({ summary }: WeeklySummaryProps) {
    const { currentWeekStats, previousWeekStats } = summary;

    // 比較の表示ヘルパー
    const getDiffText = (current: number, prev: number, label: string) => {
        const diff = current - prev;
        if (diff > 0) {
            return <span className="text-green-600 text-sm font-medium">↑ 前週比 +{diff}{label}</span>;
        } else if (diff < 0) {
            return <span className="text-red-600 text-sm font-medium">↓ 前週比 {diff}{label}</span>;
        }
        return <span className="text-slate-400 text-sm font-medium">→ 前週と同じ</span>;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                {/* 全体の記録日数 */}
                <div className="p-5 flex flex-col items-center justify-center text-center">
                    <p className="text-slate-500 text-sm font-medium mb-1">記録日数</p>
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl font-bold font-sans tracking-tight text-slate-800">
                            {currentWeekStats.totalRecords}
                        </span>
                        <span className="text-slate-500 font-medium text-sm">日</span>
                    </div>
                    {getDiffText(currentWeekStats.totalRecords, previousWeekStats.totalRecords, '日')}
                </div>

                {/* Gold 達成 */}
                <div className="p-5 flex flex-col items-center justify-center text-center bg-yellow-50/30">
                    <p className="text-yellow-700 text-sm font-medium mb-1 flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                        Gold 達成
                    </p>
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl font-bold font-sans tracking-tight text-yellow-600">
                            {currentWeekStats.goldAchieved}
                        </span>
                        <span className="text-yellow-600/70 font-medium text-sm">日</span>
                    </div>
                    {getDiffText(currentWeekStats.goldAchieved, previousWeekStats.goldAchieved, '日')}
                </div>

                {/* Silver 達成 */}
                <div className="p-5 flex flex-col items-center justify-center text-center bg-slate-50/50">
                    <p className="text-slate-600 text-sm font-medium mb-1 flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                        Silver 達成
                    </p>
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl font-bold font-sans tracking-tight text-slate-600">
                            {currentWeekStats.silverAchieved}
                        </span>
                        <span className="text-slate-500 font-medium text-sm">日</span>
                    </div>
                    {getDiffText(currentWeekStats.silverAchieved, previousWeekStats.silverAchieved, '日')}
                </div>

                {/* Bronze 達成 */}
                <div className="p-5 flex flex-col items-center justify-center text-center bg-orange-50/30">
                    <p className="text-orange-700 text-sm font-medium mb-1 flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                        Bronze 達成
                    </p>
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-4xl font-bold font-sans tracking-tight text-orange-600">
                            {currentWeekStats.bronzeAchieved}
                        </span>
                        <span className="text-orange-600/70 font-medium text-sm">日</span>
                    </div>
                    {getDiffText(currentWeekStats.bronzeAchieved, previousWeekStats.bronzeAchieved, '日')}
                </div>

            </div>
        </div>
    );
}
