'use client';

// 目標編集画面の Client Component

import { AppLayout } from '@/components/layout/AppLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Goal, GoalLevel, GoalChangeReason } from '@/types';

interface GoalsClientProps {
  initialGoals: Goal[];
  editParam: string | null;
}

export function GoalsClient({ initialGoals, editParam }: GoalsClientProps) {
  const router = useRouter();

  const [bronzeDesc, setBronzeDesc] = useState(
    initialGoals.find(g => g.level === 'bronze')?.description || ''
  );
  const [silverDesc, setSilverDesc] = useState(
    initialGoals.find(g => g.level === 'silver')?.description || ''
  );
  const [goldDesc, setGoldDesc] = useState(
    initialGoals.find(g => g.level === 'gold')?.description || ''
  );
  const [loading, setLoading] = useState(false);

  // 編集可能かどうかを判定
  const canEditBronze = !editParam || editParam === 'bronze' || editParam === 'silver' || editParam === 'gold' || editParam === 'all';
  const canEditSilver = !editParam || editParam === 'silver' || editParam === 'gold' || editParam === 'all';
  const canEditGold = !editParam || editParam === 'gold' || editParam === 'all';

  // 保存処理
  const handleSave = async () => {
    if (!bronzeDesc.trim() || !silverDesc.trim() || !goldDesc.trim()) {
      alert('すべての目標を入力してください');
      return;
    }

    setLoading(true);
    try {
      // API Route 経由で更新
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bronze: bronzeDesc.trim(),
          silver: silverDesc.trim(),
          gold: goldDesc.trim(),
          changeReason: determineChangeReason(editParam),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goals');
      }

      router.push('/');
    } catch (error) {
      console.error('Failed to update goals:', error);
      alert('目標の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * editパラメータから変更理由を判定
   */
  function determineChangeReason(editParam: string | null): GoalChangeReason {
    switch (editParam) {
      case 'bronze':
        return 'bronze_14days';
      case 'silver':
        return 'silver_14days';
      case 'gold':
        return 'gold_14days';
      case 'all':
        return '7days_4fails';
      default:
        return 'initial';
    }
  }

  return (
    <AppLayout pageTitle="目標編集">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">目標の編集</h2>
          <p className="text-sm text-slate-600 mb-6">
            3段階の目標を設定してください。Bronze（最低限）、Silver（計画通り）、Gold（期待以上）の順で難易度が上がります。
          </p>

          {/* 権限に応じた説明メッセージ */}
          {editParam && editParam !== 'all' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                {editParam === 'bronze' && '🎉 Bronze目標のみ編集可能です（14日連続達成おめでとうございます！）'}
                {editParam === 'silver' && '🎉 Bronze・Silver目標が編集可能です（Silver 14日連続達成おめでとうございます！）'}
                {editParam === 'gold' && '🎉 すべての目標が編集可能です（Gold 14日連続達成おめでとうございます！）'}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Bronze目標 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bronze目標（最低限）
                {!canEditBronze && <span className="ml-2 text-xs text-slate-500">（編集不可）</span>}
              </label>
              <input
                type="text"
                value={bronzeDesc}
                onChange={e => setBronzeDesc(e.target.value)}
                disabled={!canEditBronze || loading}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditBronze ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="例: 30分だけプログラミングする"
              />
              <p className="text-xs text-slate-500 mt-1">
                どんなに忙しくても、これだけは達成したい最低ラインの目標
              </p>
            </div>

            {/* Silver目標 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Silver目標（計画通り）
                {!canEditSilver && <span className="ml-2 text-xs text-slate-500">（編集不可）</span>}
              </label>
              <input
                type="text"
                value={silverDesc}
                onChange={e => setSilverDesc(e.target.value)}
                disabled={!canEditSilver || loading}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditSilver ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="例: 1つの機能を完成させる"
              />
              <p className="text-xs text-slate-500 mt-1">
                通常の日に達成したい、標準的な目標
              </p>
            </div>

            {/* Gold目標 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gold目標（期待以上）
                {!canEditGold && <span className="ml-2 text-xs text-slate-500">（編集不可）</span>}
              </label>
              <input
                type="text"
                value={goldDesc}
                onChange={e => setGoldDesc(e.target.value)}
                disabled={!canEditGold || loading}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditGold ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="例: リファクタリングまで完了させる"
              />
              <p className="text-xs text-slate-500 mt-1">
                調子が良い日に目指したい、理想的な目標
              </p>
            </div>
          </div>

          {/* ボタン */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => router.push('/')}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-slate-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新する'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
