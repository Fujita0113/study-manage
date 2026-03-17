'use client';

import { useRouter } from 'next/navigation';

interface WeeklyReviewReminderDialogProps {
    show: boolean;
}

export function WeeklyReviewReminderDialog({ show }: WeeklyReviewReminderDialogProps) {
    const router = useRouter();

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-300">
                {/* アイコン */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <span className="text-3xl">📝</span>
                    </div>
                </div>

                {/* タイトル */}
                <h2 className="text-xl font-bold text-slate-800 text-center mb-3">
                    今週の振り返りをしましょう
                </h2>

                {/* 説明 */}
                <p className="text-slate-600 text-center text-sm mb-6 leading-relaxed">
                    1週間の難易度メモを振り返り、<br />
                    Bronze・Silverの目標が今の自分に合っているか<br />
                    チューニングしましょう。
                </p>

                {/* ボタン */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => router.push('/weekly-review')}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
                    >
                        週次振り返りを開く
                    </button>
                    <button
                        onClick={() => {
                            // ダイアログを閉じる（セッション中のみ）
                            // ページリロードすればまた出る
                            const dialog = document.querySelector('[data-weekly-review-dialog]');
                            if (dialog) dialog.remove();
                        }}
                        className="w-full px-6 py-3 text-slate-500 text-sm hover:text-slate-700 transition-colors"
                    >
                        あとで
                    </button>
                </div>
            </div>
        </div>
    );
}
