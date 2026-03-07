'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TimelineTodo } from '@/types';
import {
    addTimelineTodoAction,
    deleteTimelineTodoAction,
    restoreTimelineTodoAction
} from '@/lib/actions/timeline';

interface Props {
    initialTodos: TimelineTodo[];
    userId: string;
}

type TabType = 'active' | 'deleted';

export default function TimelineClient({ initialTodos, userId }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [todos, setTodos] = useState<TimelineTodo[]>(initialTodos);

    // Add state
    const [newTime, setNewTime] = useState('08:00');
    const [newContent, setNewContent] = useState('');

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteReason, setDeleteReason] = useState('');

    const activeTodos = todos.filter(t => !t.isDeleted).sort((a, b) => a.timeTag.localeCompare(b.timeTag));
    const deletedTodos = todos.filter(t => t.isDeleted).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTime || !newContent.trim() || isPending) return;

        startTransition(async () => {
            try {
                const newRecord = await addTimelineTodoAction(userId, newTime, newContent);
                setTodos(prev => [...prev, newRecord]);
                setNewContent('');
                router.refresh();
            } catch (error) {
                console.error('Failed to add routine:', error);
                alert('追加に失敗しました');
            }
        });
    };

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingId || !deleteReason.trim() || isPending) return;

        startTransition(async () => {
            try {
                const updated = await deleteTimelineTodoAction(userId, deletingId, deleteReason);
                setTodos(prev => prev.map(t => t.id === deletingId ? updated : t));
                setDeletingId(null);
                setDeleteReason('');
                router.refresh();
            } catch (error) {
                console.error('Failed to delete routine:', error);
                alert('削除に失敗しました');
            }
        });
    };

    const handleRestore = async (id: string) => {
        if (isPending) return;

        startTransition(async () => {
            try {
                const updated = await restoreTimelineTodoAction(userId, id);
                setTodos(prev => prev.map(t => t.id === id ? updated : t));
                router.refresh();
            } catch (error) {
                console.error('Failed to restore routine:', error);
                alert('復活に失敗しました');
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'active'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    実施中 ({activeTodos.length})
                </button>
                <button
                    onClick={() => setActiveTab('deleted')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'deleted'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    削除済み ({deletedTodos.length})
                </button>
            </div>

            {activeTab === 'active' ? (
                <div className="space-y-6">
                    {/* Add Form */}
                    <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3 items-end">
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-slate-500 mb-1">時間</label>
                            <input
                                type="time"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">ルーティン内容</label>
                            <input
                                type="text"
                                placeholder="例: 朝のコーヒーを淹れて15分読書"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isPending || !newContent.trim()}
                            className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            追加
                        </button>
                    </form>

                    {/* Active List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                        {activeTodos.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                まだルーティンがありません。新しいルーティンを追加しましょう！
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {activeTodos.map((todo) => (
                                    <div key={todo.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors relative z-10">
                                        <div className="flex-shrink-0 font-mono text-lg font-semibold text-slate-700 w-16 text-right">
                                            {todo.timeTag}
                                        </div>
                                        {/* タイムラインのノード */}
                                        <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm shrink-0 mt-0.5 z-10 relative hidden sm:block" />

                                        <div className="flex-1 ml-2">
                                            <p className="text-slate-800">{todo.content}</p>
                                        </div>
                                        <button
                                            onClick={() => setDeletingId(todo.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                            title="削除"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* タイムラインの線 */}
                        {activeTodos.length > 0 && (
                            <div className="absolute left-[97px] top-6 bottom-6 w-px bg-slate-200 hidden sm:block pointer-events-none z-0" />
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-lg font-medium text-slate-800">削除されたルーティン</h2>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {deletedTodos.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                削除されたルーティンはありません。
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {deletedTodos.map((todo) => (
                                    <div key={todo.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors opacity-75">
                                        <div className="flex-shrink-0 font-mono text-sm font-medium text-slate-500 line-through w-16 text-right mt-0.5">
                                            {todo.timeTag}
                                        </div>
                                        <div className="flex-1 ml-1 sm:ml-5">
                                            <p className="text-slate-600 line-through mb-1">{todo.content}</p>
                                            {todo.deleteReason && (
                                                <p className="text-sm text-red-500 bg-red-50 inline-block px-2 py-1 rounded">
                                                    理由: {todo.deleteReason}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRestore(todo.id)}
                                            disabled={isPending}
                                            className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 mt-0.5"
                                        >
                                            復活
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingId && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <form onSubmit={handleDelete} className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">ルーティンを削除</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                本当にこのルーティンを削除しますか？<br />
                                状況の変化などでやめる場合、理由を残しておくと後で振り返りやすくなります。
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    削除する理由 <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="例: 早起きが辛くなったから、別の時間帯に移動したから..."
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 border h-24 resize-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeletingId(null);
                                        setDeleteReason('');
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || !deleteReason.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 transition-colors"
                                >
                                    削除する
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
