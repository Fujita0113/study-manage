'use client';

import type { TodoAnalysisItem } from '@/types';

interface TodoAnalysisProps {
    analysis: TodoAnalysisItem[];
}

export function TodoAnalysis({ analysis }: TodoAnalysisProps) {
    if (!analysis || analysis.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                今週のTODO記録はまだありません。
            </div>
        );
    }

    // レベルごとのバッジスタイル
    const getBadgeStyle = (item: TodoAnalysisItem) => {
        if (item.type === 'routine') {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }

        switch (item.goalLevel) {
            case 'gold': return 'bg-yellow-50 text-yellow-700 border-yellow-300';
            case 'silver': return 'bg-slate-50 text-slate-700 border-slate-300';
            case 'bronze': return 'bg-orange-50 text-orange-700 border-orange-300';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getLabel = (item: TodoAnalysisItem) => {
        if (item.type === 'routine') return 'ルーティン';
        switch (item.goalLevel) {
            case 'gold': return 'Gold 目標';
            case 'silver': return 'Silver 目標';
            case 'bronze': return 'Bronze 目標';
            default: return '目標';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
                {analysis.map((item) => (
                    <div key={item.todoId} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getBadgeStyle(item)}`}>
                                    {getLabel(item)}
                                </span>
                            </div>
                            <h3 className="text-slate-800 font-medium truncate">{item.content}</h3>
                        </div>

                        <div className="flex items-center gap-6 sm:w-64 shrink-0">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-500 font-medium">達成率</span>
                                    <span className={`font-bold ${item.achievementRate < 50 ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {item.achievementRate}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.achievementRate < 50 ? 'bg-red-400' : 'bg-emerald-500'} transition-all duration-500`}
                                        style={{ width: `${item.achievementRate}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-right w-16">
                                <div className="text-xs text-slate-400 font-medium mb-0.5">達成日数</div>
                                <div className="text-sm font-semibold text-slate-700">
                                    {item.achievedCount} <span className="text-xs text-slate-400 font-normal">/ {item.totalCount}日</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
