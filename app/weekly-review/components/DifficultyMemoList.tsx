'use client';

interface DifficultyMemo {
    date: string;
    displayDate: string;
    memo: string | null;
}

interface DifficultyMemoListProps {
    memos: DifficultyMemo[];
}

export function DifficultyMemoList({ memos }: DifficultyMemoListProps) {
    const hasMemos = memos.some(m => m.memo);

    return (
        <div className="space-y-3">
            {!hasMemos && (
                <p className="text-sm text-slate-500 italic">
                    今週の難易度メモはまだありません。記録画面で入力すると、ここに表示されます。
                </p>
            )}
            {memos.map((item) => (
                <div
                    key={item.date}
                    className={`p-4 rounded-lg border ${item.memo
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-700">
                            {item.displayDate}
                        </span>
                        {!item.memo && (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                メモなし
                            </span>
                        )}
                    </div>
                    {item.memo && (
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {item.memo}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
