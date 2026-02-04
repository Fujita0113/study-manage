// 日詳細画面（TODO表示版）

import { AppLayout } from '@/components/layout/AppLayout';
import {
  getDailyRecordByDate,
  calculateStreakFromRecords,
  getDailyTodoRecords,
} from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import type { GoalLevel } from '@/types';
import { requireAuth } from '@/lib/auth/server';
import {
  formatDateJP,
  getLevelLabel,
  getLevelBadgeClass
} from '@/lib/utils';
import Link from 'next/link';
import { Check } from 'lucide-react';

interface DayDetailPageProps {
  params: Promise<{ date: string }> | { date: string };
}

interface AchievedTodo {
  id: string;
  content: string;
  level?: GoalLevel;
  type: 'goal' | 'other';
}

export default async function DayDetailPage({ params }: DayDetailPageProps) {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();

  // Next.js 15対応: paramsがPromiseの場合はawaitする
  const resolvedParams = 'then' in params ? await params : params;
  const { date } = resolvedParams;

  // 日付の記録を取得
  const record = await getDailyRecordByDate(date, user.id);

  // ストリークを計算
  const streakDays = await calculateStreakFromRecords(user.id);

  if (!record) {
    return (
      <AppLayout pageTitle="日詳細" streakDays={streakDays}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {formatDateJP(date)} の記録
            </h2>
            <p className="text-sm text-slate-500">この日の記録はありません</p>
            <Link
              href="/calendar"
              className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              ← カレンダーに戻る
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 達成TODOを取得
  const todoRecords = await getDailyTodoRecords(record.id);
  const achievedTodos: AchievedTodo[] = [];

  if (todoRecords.length > 0) {
    const supabase = await createClient();

    // Goal TODOのコンテンツを取得
    const goalTodoIds = todoRecords
      .filter(r => r.todoType === 'goal' && r.isAchieved)
      .map(r => r.todoId);

    if (goalTodoIds.length > 0) {
      const { data: goalTodos } = await supabase
        .from('goal_todos')
        .select('id, content, goal_id')
        .in('id', goalTodoIds);

      if (goalTodos) {
        // goal_idからlevelを取得
        const goalIds = [...new Set(goalTodos.map(t => t.goal_id))];
        const { data: goals } = await supabase
          .from('goals')
          .select('id, level')
          .in('id', goalIds);

        const goalLevelMap = new Map(goals?.map(g => [g.id, g.level as GoalLevel]) || []);

        goalTodos.forEach(t => {
          achievedTodos.push({
            id: t.id,
            content: t.content,
            level: goalLevelMap.get(t.goal_id),
            type: 'goal',
          });
        });
      }
    }

    // Other TODOのコンテンツを取得
    const otherTodoIds = todoRecords
      .filter(r => r.todoType === 'other' && r.isAchieved)
      .map(r => r.todoId);

    if (otherTodoIds.length > 0) {
      const { data: otherTodos } = await supabase
        .from('other_todos')
        .select('id, content')
        .in('id', otherTodoIds);

      if (otherTodos) {
        otherTodos.forEach(t => {
          achievedTodos.push({
            id: t.id,
            content: t.content,
            type: 'other',
          });
        });
      }
    }
  }

  // レベル別にグループ化
  const todosByLevel: Record<GoalLevel | 'other', AchievedTodo[]> = {
    bronze: achievedTodos.filter(t => t.level === 'bronze'),
    silver: achievedTodos.filter(t => t.level === 'silver'),
    gold: achievedTodos.filter(t => t.level === 'gold'),
    other: achievedTodos.filter(t => t.type === 'other'),
  };

  const levelConfig: Record<GoalLevel | 'other', { label: string; bgColor: string; textColor: string }> = {
    bronze: { label: 'Bronze', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
    silver: { label: 'Silver', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
    gold: { label: 'Gold', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
    other: { label: 'その他', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  };

  return (
    <AppLayout pageTitle={`${formatDateJP(date)} の記録`} streakDays={streakDays}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ナビゲーション */}
        <div>
          <Link
            href="/calendar"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← カレンダーに戻る
          </Link>
        </div>

        {/* 日付 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800">{formatDateJP(date)}</h2>
        </div>

        {/* 達成度 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">達成度</h2>
          <span
            className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${getLevelBadgeClass(
              record.achievementLevel
            )}`}
          >
            {getLevelLabel(record.achievementLevel)}
          </span>
        </div>

        {/* 達成TODOリスト */}
        {achievedTodos.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">達成したTODO</h2>
            <div className="space-y-4">
              {(['bronze', 'silver', 'gold', 'other'] as const).map(level => {
                const todos = todosByLevel[level];
                if (todos.length === 0) return null;
                const config = levelConfig[level];

                return (
                  <div key={level} className={`rounded-lg ${config.bgColor} p-4`}>
                    <h3 className={`font-semibold ${config.textColor} mb-2`}>
                      {config.label}
                    </h3>
                    <ul className="space-y-1">
                      {todos.map(todo => (
                        <li key={todo.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{todo.content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 旧形式: do_textを表示 */
          record.doText && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">学習内容サマリー</h2>
              <p className="text-slate-700 whitespace-pre-wrap">{record.doText}</p>
            </div>
          )
        )}

        {/* 自由記述（Journal） */}
        {record.journalText && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">自由記述</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{record.journalText}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
