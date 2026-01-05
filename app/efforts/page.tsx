'use client';

// 工夫管理画面（実装計画書に従った実装）

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { getEfforts, updateEffort, reactivateEffort } from '@/lib/db';
import { getLevelBadgeClass } from '@/lib/utils';
import { MOCK_USER_ID } from '@/lib/mockData';
import type { Effort } from '@/types';

export default function EffortsPage() {
  const [activeEfforts, setActiveEfforts] = useState<Effort[]>([]);
  const [archivedEfforts, setArchivedEfforts] = useState<Effort[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // データ取得
  const loadEfforts = async () => {
    try {
      const active = await getEfforts(MOCK_USER_ID, { status: 'active' });
      const archived = await getEfforts(MOCK_USER_ID, { status: 'archived' });
      setActiveEfforts(active);
      setArchivedEfforts(archived);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load efforts:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEfforts();
  }, []);

  // 編集開始
  const handleStartEdit = (effort: Effort) => {
    setEditingId(effort.id);
    setEditTitle(effort.title);
  };

  // 編集保存
  const handleSaveEdit = async (effortId: string) => {
    if (!editTitle.trim()) {
      alert('工夫の内容を入力してください');
      return;
    }

    try {
      await updateEffort(effortId, { title: editTitle.trim() });
      setEditingId(null);
      setEditTitle('');
      await loadEfforts(); // データを再取得
    } catch (error) {
      console.error('Failed to update effort:', error);
      alert('更新に失敗しました');
    }
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // 工夫の再開
  const handleReactivate = async (effortId: string) => {
    try {
      await reactivateEffort(effortId);
      await loadEfforts(); // データを再取得
    } catch (error) {
      console.error('Failed to reactivate effort:', error);
      alert('再開に失敗しました');
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="工夫管理">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="工夫管理">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 現在進行中の工夫一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">現在進行中の工夫</h2>
          {activeEfforts.length === 0 ? (
            <p className="text-sm text-slate-500">現在進行中の工夫がありません</p>
          ) : (
            <div className="space-y-3">
              {activeEfforts.map(effort => (
                <div key={effort.id} className="border border-gray-200 rounded-lg p-4">
                  {editingId === effort.id ? (
                    /* 編集モード */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          工夫の内容
                        </label>
                        <textarea
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(effort.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 表示モード */
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${getLevelBadgeClass(
                              effort.goalLevel
                            )}`}
                          >
                            {effort.goalLevel}
                          </span>
                        </div>
                        <p className="text-slate-800">{effort.title}</p>
                        {effort.description && (
                          <p className="text-sm text-slate-600 mt-1">{effort.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleStartEdit(effort)}
                        className="px-4 py-2 bg-gray-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        編集
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アーカイブ済み工夫一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">アーカイブ済み工夫</h2>
          {archivedEfforts.length === 0 ? (
            <p className="text-sm text-slate-500">アーカイブされた工夫がありません</p>
          ) : (
            <div className="space-y-3">
              {archivedEfforts.map(effort => (
                <div key={effort.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${getLevelBadgeClass(
                            effort.goalLevel
                          )}`}
                        >
                          {effort.goalLevel}
                        </span>
                        <span className="text-xs text-slate-500">アーカイブ済み</span>
                      </div>
                      <p className="text-slate-800 mb-2">{effort.title}</p>
                      {effort.description && (
                        <p className="text-sm text-slate-600">{effort.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleReactivate(effort.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      明日から再開
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}



