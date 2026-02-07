'use client';

// 設定画面 (Client Component)

import { AppLayout } from '@/components/layout/AppLayout';
import { signOut } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SettingsPageClientProps {
  streakDays: number;
  initialRecoveryGoal?: string;
  isRecoveryModeActive?: boolean;
}

export function SettingsPageClient({ streakDays, initialRecoveryGoal, isRecoveryModeActive }: SettingsPageClientProps) {
  const [loading, setLoading] = useState(false);
  const [recoveryGoal, setRecoveryGoal] = useState(initialRecoveryGoal || '');
  const [editingRecoveryGoal, setEditingRecoveryGoal] = useState(initialRecoveryGoal || '');
  const [isSavingRecovery, setIsSavingRecovery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setRecoveryGoal(initialRecoveryGoal || '');
    setEditingRecoveryGoal(initialRecoveryGoal || '');
  }, [initialRecoveryGoal]);

  const handleSaveRecoveryGoal = async () => {
    if (editingRecoveryGoal.trim().length === 0) {
      setRecoveryMessage({ type: 'error', text: 'リカバリー目標を入力してください' });
      return;
    }

    setIsSavingRecovery(true);
    setRecoveryMessage(null);

    try {
      const response = await fetch('/api/recovery-goal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: editingRecoveryGoal.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      setRecoveryGoal(editingRecoveryGoal.trim());
      setRecoveryMessage({ type: 'success', text: 'リカバリー目標を保存しました' });
      setTimeout(() => setRecoveryMessage(null), 3000);
    } catch (err) {
      setRecoveryMessage({ type: 'error', text: err instanceof Error ? err.message : '保存に失敗しました' });
    } finally {
      setIsSavingRecovery(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) {
      return;
    }

    setLoading(true);
    const result = await signOut();

    if (result.error) {
      alert('ログアウトに失敗しました。もう一度お試しください。');
      setLoading(false);
      return;
    }

    router.push('/login');
    router.refresh();
  };

  return (
    <AppLayout pageTitle="設定" streakDays={streakDays}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* リカバリー目標の編集 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">リカバリー目標</h2>
          <p className="text-sm text-slate-600 mb-4">
            調子が悪い日に実行する回復アクションを設定してください。
          </p>

          {isRecoveryModeActive && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              リカバリーモード中は編集できません
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              value={editingRecoveryGoal}
              onChange={(e) => setEditingRecoveryGoal(e.target.value)}
              placeholder="例：サウナに行く"
              disabled={isRecoveryModeActive || isSavingRecovery}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            {recoveryMessage && (
              <div className={`px-4 py-2 rounded-lg text-sm ${
                recoveryMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {recoveryMessage.text}
              </div>
            )}

            <button
              onClick={handleSaveRecoveryGoal}
              disabled={isRecoveryModeActive || isSavingRecovery || editingRecoveryGoal === recoveryGoal}
              className="px-6 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingRecovery ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* ルール確認 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">ルール確認</h2>
          <p className="text-sm text-slate-600 mb-4">
            このアプリでは、以下のルールで目標のレベルアップ・レベルダウンを提案します。
          </p>

          <div className="space-y-3">
            <div className="border-l-4 border-green-500 bg-green-50 p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                レベルアップ提案
              </h3>
              <p className="text-sm text-green-700">
                同じレベルを14日連続で達成した場合、目標をレベルアップすることを提案します。
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                レベルダウン提案
              </h3>
              <p className="text-sm text-yellow-700">
                Bronze未達が4日以上続いた場合、目標をレベルダウンすることを提案します。無理のないペースで続けることが大切です。
              </p>
            </div>
          </div>
        </div>

        {/* ログアウト */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">アカウント</h2>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}




