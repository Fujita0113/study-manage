// ホーム画面（デイリーレポートカード形式）

import { AppLayout } from '@/components/layout/AppLayout';
import {
  getDailyRecords,
  getSuggestion,
  calculateStreakFromRecords,
  getDailyTodoRecords,
} from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import {
  formatDate,
  getLevelColor,
  getLevelLabel
} from '@/lib/utils';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/server';
import type { DailyRecord, GoalLevel } from '@/types';
import { SuggestionBanner } from '@/components/SuggestionBanner';
import { Check } from 'lucide-react';

// 日付を「2025年12月31日（火）」形式にフォーマット
function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

// 日報から100文字の抜粋を作成
function createJournalExcerpt(journalText?: string): string | undefined {
  if (!journalText) return undefined;
  return journalText.length > 100 ? journalText.substring(0, 100) + '...' : journalText;
}

interface AchievedTodoItem {
  id: string;
  content: string;
  level?: GoalLevel;
  type: 'goal' | 'other';
}

interface DailyReportCardData {
  date: string;
  displayDate: string;
  achievementLevel: DailyRecord['achievementLevel'];
  achievedTodos: AchievedTodoItem[];
  learningItems: string[]; // 旧形式用（do_textから抽出）
  journalExcerpt?: string;
}

export default async function HomePage() {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();

  // 1. 今日の日付を取得
  const today = formatDate(new Date());

  // 2. 過去14日分の記録を取得
  const endDate = today;
  const startDate = formatDate(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000));
  const records = await getDailyRecords(user.id, { startDate, endDate });

  // 3. 各記録のTODO達成情報を取得
  const supabase = await createClient();
  const dailyReportCards: DailyReportCardData[] = [];

  for (const record of records) {
    // TODO達成記録を取得
    const todoRecords = await getDailyTodoRecords(record.id);
    const achievedTodos: AchievedTodoItem[] = [];

    if (todoRecords.length > 0) {
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

    // 旧形式用: doTextから学習内容を抽出（改行区切り、最大3件）
    const learningItems = record.doText
      ? record.doText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .slice(0, 3)
      : [];

    dailyReportCards.push({
      date: record.date,
      displayDate: formatDateDisplay(record.date),
      achievementLevel: record.achievementLevel,
      achievedTodos,
      learningItems,
      journalExcerpt: createJournalExcerpt(record.journalText),
    });
  }

  // 新しい順にソート
  dailyReportCards.sort((a, b) => b.date.localeCompare(a.date));

  // 4. 提案バナーの表示判定
  const suggestion = await getSuggestion(user.id);

  // 5. ストリークを計算
  const streakDays = await calculateStreakFromRecords(user.id);

  // レベルの色設定
  const levelColorMap: Record<GoalLevel, string> = {
    bronze: 'text-amber-700',
    silver: 'text-gray-600',
    gold: 'text-yellow-600',
  };

  return (
    <AppLayout pageTitle="ホーム" streakDays={streakDays}>
      {/* デイリーレポートカードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {dailyReportCards.map((card) => (
          <Link
            key={card.date}
            href={`/day/${card.date}`}
            className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            {/* 日付と達成度バッジ */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {card.displayDate}
              </h3>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: getLevelColor(card.achievementLevel) }}
              >
                {getLevelLabel(card.achievementLevel)}
              </span>
            </div>

            {/* 達成TODO / 学習内容 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                {card.achievedTodos.length > 0 ? '達成したTODO' : '学習内容'}
              </h4>
              {card.achievedTodos.length > 0 ? (
                <ul className="space-y-1">
                  {card.achievedTodos.slice(0, 4).map((todo) => (
                    <li key={todo.id} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {todo.level && (
                          <span className={`${levelColorMap[todo.level]} font-medium mr-1`}>
                            [{todo.level.charAt(0).toUpperCase()}]
                          </span>
                        )}
                        {todo.content}
                      </span>
                    </li>
                  ))}
                  {card.achievedTodos.length > 4 && (
                    <li className="text-sm text-slate-400 pl-6">
                      ...他{card.achievedTodos.length - 4}件
                    </li>
                  )}
                </ul>
              ) : card.learningItems.length === 0 ? (
                <p className="text-sm text-slate-400">学習内容の記録なし</p>
              ) : (
                <ul className="space-y-1">
                  {card.learningItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-slate-400 mt-0.5">•</span>
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 日報抜粋 */}
            {card.journalExcerpt && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-slate-700 mb-2">日報</h4>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {card.journalExcerpt}
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* 提案バナー（右下固定） */}
      <SuggestionBanner suggestion={suggestion} />
    </AppLayout>
  );
}
