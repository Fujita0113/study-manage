'use client';

// 目標編集画面（実装計画書に従った実装）

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getGoals, updateGoal } from '@/lib/db';
import type { Goal, GoalLevel } from '@/types';

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bronzeDesc, setBronzeDesc] = useState('');
  const [silverDesc, setSilverDesc] = useState('');
  const [goldDesc, setGoldDesc] = useState('');
  const [loading, setLoading] = useState(true);

  // データ取得
  useEffect(() => {
    async function loadGoals() {
      try {
        const fetchedGoals = await getGoals();
        setGoals(fetchedGoals);

        const bronzeGoal = fetchedGoals.find(g => g.level === 'bronze');
        const silverGoal = fetchedGoals.find(g => g.level === 'silver');
        const goldGoal = fetchedGoals.find(g => g.level === 'gold');

        setBronzeDesc(bronzeGoal?.description || '');
        setSilverDesc(silverGoal?.description || '');
        setGoldDesc(goldGoal?.description || '');

        setLoading(false);
      } catch (error) {
        console.error('Failed to load goals:', error);
        setLoading(false);
      }
    }

    loadGoals();
  }, []);

  // 保存処理
  const handleSave = async () => {
    if (!bronzeDesc.trim() || !silverDesc.trim() || !goldDesc.trim()) {
      alert('すべての目標を入力してください');
      return;
    }

    try {
      await updateGoal('bronze', bronzeDesc.trim());
      await updateGoal('silver', silverDesc.trim());
      await updateGoal('gold', goldDesc.trim());
      router.push('/');
    } catch (error) {
      console.error('Failed to update goals:', error);
      alert('目標の更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="目標編集">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="目標編集">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">目標の編集</h2>
          <p className="text-sm text-slate-600 mb-6">
            3段階の目標を設定してください。Bronze（最低限）、Silver（計画通り）、Gold（期待以上）の順で難易度が上がります。
          </p>

          <div className="space-y-6">
            {/* Bronze目標 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bronze目標（最低限）
              </label>
              <input
                type="text"
                value={bronzeDesc}
                onChange={e => setBronzeDesc(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </label>
              <input
                type="text"
                value={silverDesc}
                onChange={e => setSilverDesc(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </label>
              <input
                type="text"
                value={goldDesc}
                onChange={e => setGoldDesc(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-6 py-2 border border-gray-300 text-slate-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              更新する
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


