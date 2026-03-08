'use client';

import { useState, useTransition, useEffect } from 'react';
import { updateGoalChangeMemoAction } from '@/lib/actions/weekly';

interface GoalChangeMemoBoxProps {
    memo: string;
    weekStartDate: string;
    userId: string;
}

export function GoalChangeMemoBox({ memo: initialMemo, weekStartDate, userId }: GoalChangeMemoBoxProps) {
    const [isPending, startTransition] = useTransition();
    const [content, setContent] = useState(initialMemo);
    const [isSaved, setIsSaved] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setIsDirty(content !== initialMemo);
    }, [content, initialMemo]);

    const handleSave = () => {
        if (content.trim() === initialMemo.trim()) return;

        startTransition(async () => {
            try {
                await updateGoalChangeMemoAction(userId, weekStartDate, content);
                setIsSaved(true);
                setIsDirty(false);
                setTimeout(() => setIsSaved(false), 3000);
            } catch (error) {
                console.error('Failed to save memo', error);
            }
        });
    };

    return (
        <div className="bg-[#FEFCE8] border border-yellow-200 rounded-xl p-5 shadow-sm relative h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                    <span>📝</span>
                    チェンジメモ
                </h3>

                <div className="flex items-center gap-3">
                    {isSaved && (
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 animate-pulse">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            保存しました
                        </span>
                    )}
                    {isDirty && !isPending && !isSaved && (
                        <span className="text-xs font-medium text-amber-600">未保存の変更があります</span>
                    )}
                </div>
            </div>

            <p className="text-xs text-yellow-700/80 mb-3">
                目標を変更する前に、なぜ変えたいのか、気づきやアイデアを自由に書き留めておきましょう。
            </p>

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="例: 最近残業が多くて平日の学習時間が取れない。Bronze目標を「10分読書」に下げた方が良さそう..."
                className="w-full flex-1 min-h-[150px] p-3 rounded-lg border border-yellow-300/50 bg-white/70 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-y text-slate-700 placeholder-slate-400 transition-colors"
            />

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isPending || !isDirty}
                    className={`
            px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2
            ${isDirty && !isPending
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow'
                            : 'bg-yellow-200 text-yellow-600 cursor-not-allowed border-transparent'
                        }
          `}
                >
                    {isPending && (
                        <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {isPending ? '保存中...' : 'メモを保存'}
                </button>
            </div>
        </div>
    );
}
