'use client';

// 目標編集画面の Client Component

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TodoList } from '@/components/todo';
import type { Goal, GoalLevel, GoalChangeReason, GoalTodo } from '@/types';

interface TodoItem {
  id?: string;
  content: string;
}

interface GoalsClientProps {
  initialGoals: Goal[];
  editParam: string | null;
  streakDays: number;
}

export function GoalsClient({ initialGoals, editParam, streakDays }: GoalsClientProps) {
  const router = useRouter();

  // 各レベルのTODOリスト状態
  const [bronzeTodos, setBronzeTodos] = useState<TodoItem[]>([]);
  const [silverTodos, setSilverTodos] = useState<TodoItem[]>([]);
  const [goldTodos, setGoldTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // goal_idのマッピング
  const bronzeGoal = initialGoals.find(g => g.level === 'bronze');
  const silverGoal = initialGoals.find(g => g.level === 'silver');
  const goldGoal = initialGoals.find(g => g.level === 'gold');

  // 編集可能かどうかを判定
  const canEditBronze = !editParam || editParam === 'bronze' || editParam === 'silver' || editParam === 'gold' || editParam === 'all';
  const canEditSilver = !editParam || editParam === 'silver' || editParam === 'gold' || editParam === 'all';
  const canEditGold = !editParam || editParam === 'gold' || editParam === 'all';

  // 初期ロード時にTODOを取得
  useEffect(() => {
    async function loadTodos() {
      try {
        const response = await fetch('/api/goals/todos');
        if (!response.ok) {
          throw new Error('Failed to fetch todos');
        }
        const data = await response.json() as Record<GoalLevel, GoalTodo[]>;

        setBronzeTodos(data.bronze.map(t => ({ id: t.id, content: t.content })));
        setSilverTodos(data.silver.map(t => ({ id: t.id, content: t.content })));
        setGoldTodos(data.gold.map(t => ({ id: t.id, content: t.content })));
      } catch (error) {
        console.error('Failed to load todos:', error);
        // フォールバック: 既存のdescriptionを1つのTODOとして表示
        setBronzeTodos(bronzeGoal?.description ? [{ content: bronzeGoal.description }] : []);
        setSilverTodos(silverGoal?.description ? [{ content: silverGoal.description }] : []);
        setGoldTodos(goldGoal?.description ? [{ content: goldGoal.description }] : []);
      } finally {
        setInitialLoading(false);
      }
    }
    loadTodos();
  }, [bronzeGoal?.description, silverGoal?.description, goldGoal?.description]);

  // 全てのレベルに1つ以上のTODOがあるかチェック
  const isFormValid = bronzeTodos.length > 0 && silverTodos.length > 0 && goldTodos.length > 0;

  // 保存処理
  const handleSave = async () => {
    if (!isFormValid) {
      alert('各レベルに少なくとも1つのTODOを設定してください');
      return;
    }

    setLoading(true);
    try {
      // 各目標のTODOを更新
      const updates: Promise<Response>[] = [];

      if (canEditBronze && bronzeGoal) {
        updates.push(
          fetch(`/api/goals/${bronzeGoal.id}/todos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ todos: bronzeTodos }),
          })
        );
      }

      if (canEditSilver && silverGoal) {
        updates.push(
          fetch(`/api/goals/${silverGoal.id}/todos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ todos: silverTodos }),
          })
        );
      }

      if (canEditGold && goldGoal) {
        updates.push(
          fetch(`/api/goals/${goldGoal.id}/todos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ todos: goldTodos }),
          })
        );
      }

      const responses = await Promise.all(updates);
      const allOk = responses.every(r => r.ok);

      if (!allOk) {
        throw new Error('Failed to update some goals');
      }

      // 目標履歴の更新（descriptionも更新）
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bronze: bronzeTodos.map(t => t.content).join('\n'),
          silver: silverTodos.map(t => t.content).join('\n'),
          gold: goldTodos.map(t => t.content).join('\n'),
          editableGoals: getEditableGoals(),
          changeReason: determineChangeReason(editParam),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal history');
      }

      router.push('/');
    } catch (error) {
      console.error('Failed to update goals:', error);
      alert('目標の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  function getEditableGoals(): GoalLevel[] {
    const editableGoals: GoalLevel[] = [];
    if (canEditBronze) editableGoals.push('bronze');
    if (canEditSilver) editableGoals.push('silver');
    if (canEditGold) editableGoals.push('gold');
    return editableGoals;
  }

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

  if (initialLoading) {
    return (
      <AppLayout pageTitle="目標編集" streakDays={streakDays}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center min-h-[300px]">
              <p className="text-slate-600">読み込み中...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="目標編集" streakDays={streakDays}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">目標の編集</h2>
          <p className="text-sm text-slate-600 mb-6">
            3段階の目標を設定してください。各レベルに複数のTODOを設定できます。
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
            <div className="rounded-lg bg-amber-50 p-4">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-bronze text-white rounded-md mr-2 text-sm font-medium">
                  Bronze
                </span>
                <span className="text-sm text-slate-600">最低限の目標</span>
                {!canEditBronze && <span className="ml-2 text-xs text-slate-500">（編集不可）</span>}
              </div>
              <TodoList
                todos={bronzeTodos}
                onChange={setBronzeTodos}
                maxItems={5}
                placeholder="例：30分だけ座って作業する"
                disabled={!canEditBronze || loading}
              />
            </div>

            {/* Silver目標 */}
            <div className="rounded-lg bg-gray-100 p-4">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-silver text-white rounded-md mr-2 text-sm font-medium">
                  Silver
                </span>
                <span className="text-sm text-slate-600">計画通りの目標</span>
                {!canEditSilver && <span className="ml-2 text-xs text-slate-500">（編集不可）</span>}
              </div>
              <TodoList
                todos={silverTodos}
                onChange={setSilverTodos}
                maxItems={5}
                placeholder="例：1機能を完成させる"
                disabled={!canEditSilver || loading}
              />
            </div>

            {/* Gold目標 */}
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-gold text-white rounded-md mr-2 text-sm font-medium">
                  Gold
                </span>
                <span className="text-sm text-slate-600">期待以上の目標</span>
                {!canEditGold && <span className="ml-2 text-xs text-slate-500">（編集不可）</span>}
              </div>
              <TodoList
                todos={goldTodos}
                onChange={setGoldTodos}
                maxItems={5}
                placeholder="例：リファクタリングまで完了する"
                disabled={!canEditGold || loading}
              />
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
              disabled={loading || !isFormValid}
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
