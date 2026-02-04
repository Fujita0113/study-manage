'use client';

// 記録・日報画面（TODOチェックリスト版）

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TodoLevelSection, OtherTodoSection } from '@/components/todo';
import type { GoalLevel, GoalTodo, OtherTodo, AchievementLevel } from '@/types';
import { formatDate } from '@/lib/utils';

interface RecordPageClientProps {
  streakDays: number;
}

export function RecordPageClient({ streakDays }: RecordPageClientProps) {
  const router = useRouter();
  const today = formatDate(new Date());

  // 目標TODOの状態
  const [goalTodos, setGoalTodos] = useState<Record<GoalLevel, GoalTodo[]>>({
    bronze: [],
    silver: [],
    gold: [],
  });
  // その他TODOの状態
  const [otherTodos, setOtherTodos] = useState<OtherTodo[]>([]);
  // 達成済みTODO ID
  const [achievedGoalTodoIds, setAchievedGoalTodoIds] = useState<Set<string>>(new Set());
  const [achievedOtherTodoIds, setAchievedOtherTodoIds] = useState<Set<string>>(new Set());
  // 日報
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 達成レベルを自動判定
  const calculateAchievementLevel = useCallback((): AchievementLevel => {
    const bronzeAchieved = goalTodos.bronze.length > 0 &&
      goalTodos.bronze.every(t => achievedGoalTodoIds.has(t.id));
    const silverAchieved = goalTodos.silver.length > 0 &&
      goalTodos.silver.every(t => achievedGoalTodoIds.has(t.id));
    const goldAchieved = goalTodos.gold.length > 0 &&
      goalTodos.gold.every(t => achievedGoalTodoIds.has(t.id));

    if (goldAchieved && silverAchieved && bronzeAchieved) {
      return 'gold';
    } else if (silverAchieved && bronzeAchieved) {
      return 'silver';
    } else if (bronzeAchieved) {
      return 'bronze';
    }
    return 'none';
  }, [goalTodos, achievedGoalTodoIds]);

  const achievementLevel = calculateAchievementLevel();

  // 初期データ取得
  useEffect(() => {
    async function loadData() {
      try {
        // 今日の記録が既にあるかチェック
        const response = await fetch(`/api/daily-records?date=${today}`);
        if (!response.ok) {
          throw new Error('Failed to fetch daily record');
        }

        const existingRecord = await response.json();
        if (existingRecord) {
          // 既に記録がある場合は日詳細ページへリダイレクト
          router.push(`/day/${today}`);
          return;
        }

        // 目標TODOを取得
        const goalTodosResponse = await fetch('/api/goals/todos');
        if (goalTodosResponse.ok) {
          const data = await goalTodosResponse.json();
          setGoalTodos(data);
        }

        // その他TODOを取得（アクティブなもののみ）
        const otherTodosResponse = await fetch('/api/other-todos');
        if (otherTodosResponse.ok) {
          const data = await otherTodosResponse.json();
          setOtherTodos(data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    }

    loadData();
  }, [today, router]);

  // 目標TODOのチェック変更
  const handleGoalTodoChange = (todoId: string, checked: boolean) => {
    setAchievedGoalTodoIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(todoId);
      } else {
        next.delete(todoId);
      }
      return next;
    });
  };

  // その他TODOのチェック変更
  const handleOtherTodoChange = (todoId: string, checked: boolean) => {
    setAchievedOtherTodoIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(todoId);
      } else {
        next.delete(todoId);
      }
      return next;
    });
  };

  // その他TODOを追加
  const handleAddOtherTodo = async (content: string) => {
    try {
      const response = await fetch('/api/other-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to create other todo');
      }

      const newTodo = await response.json();
      setOtherTodos(prev => [...prev, newTodo]);
      // 新規追加したTODOはチェック済みにする
      setAchievedOtherTodoIds(prev => new Set(prev).add(newTodo.id));
    } catch (error) {
      console.error('Failed to add other todo:', error);
      alert('TODOの追加に失敗しました');
    }
  };

  // 達成したTODO内容をdo_textとして生成
  const generateDoText = (): string => {
    const achievedContents: string[] = [];

    // 目標TODO
    (['bronze', 'silver', 'gold'] as GoalLevel[]).forEach(level => {
      goalTodos[level]
        .filter(t => achievedGoalTodoIds.has(t.id))
        .forEach(t => achievedContents.push(`[${level.toUpperCase()}] ${t.content}`));
    });

    // その他TODO
    otherTodos
      .filter(t => achievedOtherTodoIds.has(t.id))
      .forEach(t => achievedContents.push(t.content));

    return achievedContents.join('\n') || 'なし';
  };

  // 保存処理
  const handleSubmit = async () => {
    if (achievementLevel === 'none') {
      alert('少なくともBronze目標を全て達成してから記録してください');
      return;
    }

    setSaving(true);
    try {
      // 日次記録を作成
      const response = await fetch('/api/daily-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          achievementLevel,
          doText: generateDoText(),
          journalText: journal || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create daily record');
      }

      const newRecord = await response.json();

      // 達成記録を保存
      const todoRecords: { todoType: 'goal' | 'other'; todoId: string; isAchieved: boolean }[] = [];

      // 目標TODO
      (['bronze', 'silver', 'gold'] as GoalLevel[]).forEach(level => {
        goalTodos[level].forEach(t => {
          todoRecords.push({
            todoType: 'goal',
            todoId: t.id,
            isAchieved: achievedGoalTodoIds.has(t.id),
          });
        });
      });

      // その他TODO
      otherTodos.forEach(t => {
        if (achievedOtherTodoIds.has(t.id)) {
          todoRecords.push({
            todoType: 'other',
            todoId: t.id,
            isAchieved: true,
          });
        }
      });

      // 達成記録をAPIに送信
      await fetch(`/api/daily-records/${newRecord.id}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: todoRecords }),
      });

      // ホーム画面へ遷移
      router.push('/');
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('記録の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="記録・日報" streakDays={streakDays}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  // 達成状況表示
  const getLevelBadge = () => {
    const badges = {
      none: { text: '未達成', color: 'bg-gray-200 text-gray-600' },
      bronze: { text: 'Bronze達成', color: 'bg-bronze text-white' },
      silver: { text: 'Silver達成', color: 'bg-silver text-white' },
      gold: { text: 'Gold達成', color: 'bg-gold text-white' },
    };
    return badges[achievementLevel];
  };

  const badge = getLevelBadge();

  return (
    <AppLayout pageTitle="記録・日報" streakDays={streakDays}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 達成状況サマリー */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">今日の達成状況</h2>
              <p className="text-sm text-slate-600">
                各レベルのTODOを全て達成すると、そのレベルが達成となります
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg font-semibold ${badge.color}`}>
              {badge.text}
            </span>
          </div>
        </div>

        {/* 目標TODOチェックリスト */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">目標TODO</h2>
          <p className="text-sm text-slate-600 mb-4">
            達成したTODOにチェックを入れてください
          </p>
          <div className="space-y-4">
            <TodoLevelSection
              level="bronze"
              todos={goalTodos.bronze}
              achievedTodoIds={achievedGoalTodoIds}
              onTodoChange={handleGoalTodoChange}
              disabled={saving}
            />
            <TodoLevelSection
              level="silver"
              todos={goalTodos.silver}
              achievedTodoIds={achievedGoalTodoIds}
              onTodoChange={handleGoalTodoChange}
              disabled={saving}
            />
            <TodoLevelSection
              level="gold"
              todos={goalTodos.gold}
              achievedTodoIds={achievedGoalTodoIds}
              onTodoChange={handleGoalTodoChange}
              disabled={saving}
            />
          </div>
        </section>

        {/* その他TODO */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">その他TODO</h2>
          <p className="text-sm text-slate-600 mb-4">
            目標以外に達成したことを記録できます
          </p>
          <OtherTodoSection
            todos={otherTodos}
            achievedTodoIds={achievedOtherTodoIds}
            onTodoChange={handleOtherTodoChange}
            onAddTodo={handleAddOtherTodo}
            disabled={saving}
          />
        </section>

        {/* 自由記述（Journal） */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">自由記述（任意）</h2>
          <textarea
            placeholder="今日感じたこと、学んだこと、自分への褒め言葉など"
            value={journal}
            onChange={e => setJournal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            disabled={saving}
          />
        </section>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={achievementLevel === 'none' || saving}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              achievementLevel === 'none' || saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {saving ? '保存中...' : '記録を確定してロックする'}
          </button>
        </div>

        {achievementLevel === 'none' && (
          <p className="text-sm text-center text-amber-600">
            ※ Bronze目標を全て達成すると記録できるようになります
          </p>
        )}
      </div>
    </AppLayout>
  );
}
