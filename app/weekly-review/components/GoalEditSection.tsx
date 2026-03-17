'use client';

import { useState, useTransition } from 'react';
import type { Goal, GoalLevel } from '@/types';
import { updateGoalAction } from '@/lib/actions';
import { logGoalChangeAction } from '@/lib/actions/weekly';

interface GoalEditSectionProps {
    goals: Goal[];
    isMonday: boolean; // true = 月曜日（Bronze/Silver編集可能）
    userId: string;
}

export function GoalEditSection({ goals, isMonday, userId }: GoalEditSectionProps) {
    const [isPending, startTransition] = useTransition();
    const [editingLevel, setEditingLevel] = useState<GoalLevel | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editReason, setEditReason] = useState('');
    const [errorErrorMessage, setErrorMessage] = useState('');

    const handleEditClick = (goal: Goal) => {
        setEditingLevel(goal.level);
        setEditContent(goal.description || '');
        setEditReason('');
        setErrorMessage('');
    };

    const handleCancelClick = () => {
        setEditingLevel(null);
        setEditContent('');
        setEditReason('');
        setErrorMessage('');
    };

    const handleSaveClick = (goal: Goal) => {
        const isSilverBronze = goal.level === 'silver' || goal.level === 'bronze';

        if (isSilverBronze && !editReason.trim() && editContent !== goal.description) {
            setErrorMessage('目標を変更する場合、変更理由の入力が必須です。');
            return;
        }

        if (!editContent.trim()) {
            setErrorMessage('目標を入力してください。');
            return;
        }

        startTransition(async () => {
            try {
                setErrorMessage('');
                // 内容が変更された場合のみ
                if (editContent !== goal.description) {
                    await updateGoalAction(goal.level, editContent, userId);
                    // 変更ログを残す（Goldは理由が不要な場合もあるが、とりあえず空文字でログは取るか、Silver/Bronzeのようにするか。要件ではSilver/Bronzeのみ理由必須）
                    const reasonToSave = isSilverBronze ? editReason : '（Goldの随時変更）';
                    if (isSilverBronze) {
                        await logGoalChangeAction(userId, goal.level, goal.description || '', editContent, reasonToSave);
                    }
                }
                setEditingLevel(null);
            } catch (e: any) {
                setErrorMessage('保存に失敗しました。');
            }
        });
    };

    const sortedGoals = [...goals].sort((a, b) => {
        const list = ['gold', 'silver', 'bronze'];
        return list.indexOf(a.level) - list.indexOf(b.level);
    });

    return (
        <div className="space-y-4">
            {sortedGoals.map(goal => {
                const isEditing = editingLevel === goal.level;
                const isGold = goal.level === 'gold';
                const canEdit = isGold || isMonday;

                // 色設定
                const styles = {
                    gold: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', dot: 'bg-yellow-400' },
                    silver: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', dot: 'bg-slate-400' },
                    bronze: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-400' },
                }[goal.level];

                return (
                    <div key={goal.id} className={`rounded-xl border ${styles.border} ${styles.bg} p-5 relative overflow-hidden transition-all duration-300`}>
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${styles.dot}`} />

                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`font-bold capitalize flex items-center gap-2 ${styles.text}`}>
                                {goal.level}
                                {!canEdit && <span className="text-xs bg-black/5 px-2 py-0.5 rounded-full font-medium ml-2">ロック中</span>}
                                {isGold && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium ml-2">随時編集可</span>}
                            </h3>

                            {!isEditing && canEdit && (
                                <button
                                    onClick={() => handleEditClick(goal)}
                                    className="text-sm px-3 py-1.5 rounded-md font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                                >
                                    編集
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-3 mt-4 bg-white/60 p-4 rounded-lg border border-black/5 shadow-inner">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">目標内容</label>
                                    <input
                                        type="text"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-white"
                                    />
                                </div>

                                {(!isGold) && editContent !== goal.description && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">変更理由 <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={editReason}
                                            onChange={(e) => setEditReason(e.target.value)}
                                            placeholder="目標を変更する理由を入力してください..."
                                            rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 bg-white resize-none"
                                        />
                                    </div>
                                )}

                                {errorErrorMessage && (
                                    <p className="text-red-600 text-sm font-medium">{errorErrorMessage}</p>
                                )}

                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        onClick={handleCancelClick}
                                        disabled={isPending}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={() => handleSaveClick(goal)}
                                        disabled={isPending}
                                        className="px-4 py-2 text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[80px]"
                                    >
                                        {isPending ? '保存中...' : '保存'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-700 bg-white/50 p-3 rounded-lg border border-black/5">
                                {goal.description || '未設定'}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
