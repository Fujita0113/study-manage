'use client';

// 記録・日報画面（TODOチェックリスト版）

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TodoLevelSection, OtherTodoSection } from '@/components/todo';
import type { GoalLevel, GoalTodo, OtherTodo, AchievementLevel, RecoveryModeStatus } from '@/types';
import { formatDate } from '@/lib/utils';

// 日付を「2026年2月3日」形式にフォーマット
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

interface RecordPageClientProps {
  streakDays: number;
  recoveryStatus: RecoveryModeStatus;
}

export function RecordPageClient({ streakDays, recoveryStatus }: RecordPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const today = formatDate(new Date());

  // URLパラメータがあればそれを使用、なければ今日の日付
  const targetDate = dateParam || today;
  const isYesterdayRecord = dateParam && dateParam !== today;
  const pageTitle = isYesterdayRecord
    ? `${formatDisplayDate(dateParam)}の日報`
    : '記録・日報';

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
  // リカバリー達成
  const [recoveryAchieved, setRecoveryAchieved] = useState(false);
  // 日報
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // 編集モード
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(true);

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
        // 対象日の記録が既にあるかチェック
        const existingRecordResponse = await fetch(`/api/daily-records?date=${targetDate}`);
        if (!existingRecordResponse.ok) {
          throw new Error('Failed to fetch daily record');
        }

        const existingRecord = await existingRecordResponse.json();

        // daily_records APIは直接recordを返すので、それをexistingDataに変換
        const existingData = existingRecord ? {
          record: existingRecord,
          todos: [] // todosは別途取得する
        } : { record: null, todos: [] };

        // 既に記録がある場合は編集モードに切り替え
        if (existingData.record) {
          setIsEditMode(true);
          setExistingRecordId(existingData.record.id);

          // 編集可能期限を判定（記録日の当日中23:59:59まで）
          const recordDate = new Date(existingData.record.date + 'T00:00:00');
          const now = new Date();
          const recordDateEnd = new Date(recordDate);
          recordDateEnd.setHours(23, 59, 59, 999);

          // 記録日の当日かつ23:59:59より前であれば編集可能
          const isSameDay = recordDate.toDateString() === now.toDateString();
          const isBeforeDeadline = now <= recordDateEnd;
          setIsEditable(isSameDay && isBeforeDeadline);

          // 既存データを読み込む
          setJournal(existingData.record.journalText || '');
          setRecoveryAchieved(existingData.record.recoveryAchieved || false);

          // 達成TODO一覧を取得
          const todosResponse = await fetch(`/api/daily-records/${existingData.record.id}/todos`);
          if (todosResponse.ok) {
            const todosData = await todosResponse.json();
            const goalTodoIds = new Set<string>();
            const otherTodoIds = new Set<string>();

            todosData.forEach((todo: any) => {
              if (todo.todoType === 'goal' && todo.isAchieved) {
                goalTodoIds.add(todo.todoId);
              } else if (todo.todoType === 'other' && todo.isAchieved) {
                otherTodoIds.add(todo.todoId);
              }
            });
            setAchievedGoalTodoIds(goalTodoIds);
            setAchievedOtherTodoIds(otherTodoIds);
          }
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
  }, [targetDate]);

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

  // 記録可能条件: Bronze達成 OR リカバリー達成 OR 自由記述が入力されている
  const canRecord = achievementLevel !== 'none' || recoveryAchieved || journal.trim().length > 0;

  // 保存処理
  const handleSubmit = async () => {
    // Bronze未達成かつリカバリー未達成の場合、自由記述が必須
    if (achievementLevel === 'none' && !recoveryAchieved && journal.trim().length === 0) {
      alert('Bronze目標が未達成の場合、リカバリーを達成するか自由記述を入力してください');
      return;
    }

    setSaving(true);
    try {
      // doTextを生成（リカバリー達成を含む）
      let doText = generateDoText();
      if (recoveryAchieved && recoveryStatus.goal) {
        doText = `[RECOVERY] ${recoveryStatus.goal}\n${doText}`;
      }

      let recordId: string;

      if (isEditMode && existingRecordId) {
        // 編集モード: 既存レコードを更新
        const updateResponse = await fetch(`/api/daily-records/${existingRecordId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            achievementLevel,
            doText,
            journalText: journal || undefined,
            recoveryAchieved,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update daily record');
        }

        recordId = existingRecordId;
      } else {
        // 新規作成モード: 新しいレコードを作成
        const createResponse = await fetch('/api/daily-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: targetDate,
            achievementLevel,
            doText,
            journalText: journal || undefined,
            recoveryAchieved,
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create daily record');
        }

        const newRecord = await createResponse.json();
        recordId = newRecord.id;
      }

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
      await fetch(`/api/daily-records/${recordId}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: todoRecords }),
      });

      // リカバリーモードを解除（アクティブな場合、新規作成時のみ）
      if (recoveryStatus.isActive && !isEditMode) {
        await fetch('/api/recovery-mode', { method: 'DELETE' });
      }

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
      <AppLayout pageTitle={pageTitle} streakDays={streakDays}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  // 達成状況表示
  const getLevelBadge = () => {
    // リカバリー達成のみの場合
    if (achievementLevel === 'none' && recoveryAchieved) {
      return { text: '♥️ Recovery達成', color: 'bg-pink-500 text-white' };
    }
    const badges = {
      none: { text: '未達成', color: 'bg-gray-200 text-gray-600' },
      bronze: { text: 'Bronze達成', color: 'bg-bronze text-white' },
      silver: { text: 'Silver達成', color: 'bg-silver text-white' },
      gold: { text: 'Gold達成', color: 'bg-gold text-white' },
    };
    const badge = badges[achievementLevel];
    // 通常レベル達成 + リカバリー達成の場合
    if (recoveryAchieved && achievementLevel !== 'none') {
      return { text: `${badge.text} + ♥️`, color: badge.color };
    }
    return badge;
  };

  const badge = getLevelBadge();

  return (
    <AppLayout pageTitle={pageTitle} streakDays={streakDays}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 編集期限切れメッセージ */}
        {isEditMode && !isEditable && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  この日報は編集期限が過ぎています（記録日の当日中のみ編集可能）
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 達成状況サマリー */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {isYesterdayRecord ? `${formatDisplayDate(dateParam!)}の達成状況` : '今日の達成状況'}
                {isEditMode && <span className="ml-2 text-sm text-blue-600">(編集モード)</span>}
              </h2>
              <p className="text-sm text-slate-600">
                各レベルのTODOを全て達成すると、そのレベルが達成となります
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg font-semibold ${badge.color}`}>
              {badge.text}
            </span>
          </div>
        </div>

        {/* リカバリーセクション（リカバリーモード中のみ表示） */}
        {recoveryStatus.isActive && recoveryStatus.goal && (
          <section className="bg-pink-50 rounded-lg shadow-sm border-2 border-pink-300 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">♥️</span>
              <h2 className="text-xl font-semibold text-pink-800">Recovery</h2>
            </div>
            <p className="text-sm text-pink-700 mb-4">
              リカバリーモード中です。以下の目標を達成してチェックを入れてください。
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recoveryAchieved}
                onChange={(e) => setRecoveryAchieved(e.target.checked)}
                disabled={saving || !isEditable}
                className="mt-0.5 w-5 h-5 rounded border-pink-300 text-pink-600 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-lg ${recoveryAchieved ? 'line-through text-pink-400' : 'text-pink-800'}`}>
                {recoveryStatus.goal}
              </span>
            </label>
          </section>
        )}

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
              disabled={saving || !isEditable}
            />
            <TodoLevelSection
              level="silver"
              todos={goalTodos.silver}
              achievedTodoIds={achievedGoalTodoIds}
              onTodoChange={handleGoalTodoChange}
              disabled={saving || !isEditable}
            />
            <TodoLevelSection
              level="gold"
              todos={goalTodos.gold}
              achievedTodoIds={achievedGoalTodoIds}
              onTodoChange={handleGoalTodoChange}
              disabled={saving || !isEditable}
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
            disabled={saving || !isEditable}
          />
        </section>

        {/* 自由記述（Journal） */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">自由記述（任意）</h2>
          <textarea
            placeholder="今日感じたこと、学んだこと、自分への褒め言葉など"
            value={journal}
            onChange={e => setJournal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={4}
            disabled={saving || !isEditable}
          />
        </section>

        {/* 保存ボタン */}
        {isEditable && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canRecord || saving}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                !canRecord || saving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {saving ? '保存中...' : isEditMode ? '変更を保存する' : '記録を確定してロックする'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
