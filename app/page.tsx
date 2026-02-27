// ホーム画面（デイリーレポートカード形式）

import { AppLayout } from '@/components/layout/AppLayout';
import {
  getDailyRecords,
  getSuggestion,
  calculateStreakFromRecords,
  getDailyTodoRecords,
  checkYesterdayRecord,
  getRecoveryModeStatus,
  getDailyRecordByDate,
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
import { YesterdayRecordBanner } from '@/components/YesterdayRecordBanner';
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
  recoveryAchieved: boolean;
  achievedTodos: AchievedTodoItem[];
  learningItems: string[]; // 旧形式用（do_textから抽出）
  journalExcerpt?: string;
  satisfaction?: number; // 1〜5
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

  // 3. 各記録のTODO達成情報を一括で取得
  const supabase = await createClient();
  const dailyReportCards: DailyReportCardData[] = [];

  const recordIds = records.map(r => r.id);

  // TodoRecordsの一括取得
  const { data: allTodoRecords } = recordIds.length > 0
    ? await supabase.from('daily_todo_records').select('*').in('daily_record_id', recordIds)
    : { data: [] };
  const todoRecords = allTodoRecords || [];

  // Goal Todoの一括取得
  const goalTodoIds = todoRecords.filter(r => r.todo_type === 'goal' && r.is_achieved).map(r => r.todo_id);
  const { data: allGoalTodos } = goalTodoIds.length > 0
    ? await supabase.from('goal_todos').select('id, content, goal_id').in('id', goalTodoIds)
    : { data: [] };
  const goalTodos = allGoalTodos || [];

  // Goal Level の一括取得
  const goalIds = [...new Set(goalTodos.map(t => t.goal_id))];
  const { data: allGoals } = goalIds.length > 0
    ? await supabase.from('goals').select('id, level').in('id', goalIds)
    : { data: [] };
  const goalLevelMap = new Map((allGoals || []).map(g => [g.id, g.level as GoalLevel]));

  // Other Todoの一括取得
  const otherTodoIds = todoRecords.filter(r => r.todo_type === 'other' && r.is_achieved).map(r => r.todo_id);
  const { data: allOtherTodos } = otherTodoIds.length > 0
    ? await supabase.from('other_todos').select('id, content').in('id', otherTodoIds)
    : { data: [] };
  const otherTodos = allOtherTodos || [];

  // Map作成
  const goalTodoMap = new Map(goalTodos.map(t => [t.id, t]));
  const otherTodoMap = new Map(otherTodos.map(t => [t.id, t]));
  const todoRecordsByRecordId = new Map<string, typeof todoRecords>();
  todoRecords.forEach(r => {
    if (!todoRecordsByRecordId.has(r.daily_record_id)) {
      todoRecordsByRecordId.set(r.daily_record_id, []);
    }
    todoRecordsByRecordId.get(r.daily_record_id)!.push(r);
  });

  for (const record of records) {
    const recordTodos = todoRecordsByRecordId.get(record.id) || [];
    const achievedTodos: AchievedTodoItem[] = [];

    recordTodos.forEach(r => {
      if (r.todo_type === 'goal' && r.is_achieved) {
        const t = goalTodoMap.get(r.todo_id);
        if (t) {
          achievedTodos.push({
            id: t.id,
            content: t.content,
            level: goalLevelMap.get(t.goal_id),
            type: 'goal',
          });
        }
      } else if (r.todo_type === 'other' && r.is_achieved) {
        const t = otherTodoMap.get(r.todo_id);
        if (t) {
          achievedTodos.push({
            id: t.id,
            content: t.content,
            type: 'other',
          });
        }
      }
    });

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
      recoveryAchieved: record.recoveryAchieved || false,
      achievedTodos,
      learningItems,
      journalExcerpt: createJournalExcerpt(record.journalText),
      satisfaction: record.satisfaction,
    });
  }

  // 新しい順にソート
  dailyReportCards.sort((a, b) => b.date.localeCompare(a.date));

  // 4〜8. 非依存のデータ取得を並列化
  const [
    suggestion,
    streakDays,
    yesterdayStatus,
    recoveryStatus,
    todayRecord
  ] = await Promise.all([
    getSuggestion(user.id),
    calculateStreakFromRecords(user.id),
    checkYesterdayRecord(user.id),
    getRecoveryModeStatus(user.id),
    getDailyRecordByDate(today, user.id)
  ]);

  const canShowRecoveryButton = !todayRecord && recoveryStatus.goal !== null;

  // レベルの色設定
  const levelColorMap: Record<GoalLevel, string> = {
    bronze: 'text-amber-700',
    silver: 'text-gray-600',
    gold: 'text-yellow-600',
  };

  return (
    <AppLayout
      pageTitle="ホーム"
      streakDays={streakDays}
      recoveryStatus={recoveryStatus}
      canShowRecoveryButton={canShowRecoveryButton}
    >
      {/* デイリーレポートカードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {dailyReportCards.map((card) => (
          <Link
            key={card.date}
            href={card.date === today ? `/record` : `/day/${card.date}`}
            className="block bg-white rounded-lg border border-[#E9E9E7] p-4 hover:bg-[#F9F9F8] transition-colors shadow-sm"
          >
            {/* 日付と達成度バッジ */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-[#37352F]">
                {card.displayDate}
              </h3>
              <div className="flex items-center gap-2">
                {card.satisfaction != null && (
                  <span className="text-xl" title={`満足度: ${['', '最悪', '微妙', '普通', '良い', '最高'][card.satisfaction]}`}>
                    {['', '😞', '😟', '😐', '🙂', '😄'][card.satisfaction]}
                  </span>
                )}
                {card.recoveryAchieved && (
                  <span className="text-lg" title="リカバリー達成">♥️</span>
                )}
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ color: getLevelColor(card.achievementLevel), backgroundColor: `${getLevelColor(card.achievementLevel)}15` }}
                >
                  {getLevelLabel(card.achievementLevel)}
                </span>
              </div>
            </div>

            {/* 達成TODO / 学習内容 */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-[#9B9A97] mb-1.5 uppercase tracking-wider">
                {card.achievedTodos.length > 0 ? '達成したTODO' : '学習内容'}
              </h4>
              {card.achievedTodos.length > 0 ? (
                <ul className="space-y-0.5">
                  {card.achievedTodos.slice(0, 4).map((todo) => (
                    <li key={todo.id} className="flex items-start gap-1.5 text-sm text-[#37352F]">
                      <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1 leading-snug">
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
                    <li className="text-xs text-[#9B9A97] pl-5">
                      ...他{card.achievedTodos.length - 4}件
                    </li>
                  )}
                </ul>
              ) : card.learningItems.length === 0 ? (
                <p className="text-sm text-[#9B9A97]">学習内容の記録なし</p>
              ) : (
                <ul className="space-y-0.5">
                  {card.learningItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-sm text-[#37352F]">
                      <span className="text-[#9B9A97] mt-0.5">•</span>
                      <span className="line-clamp-1 leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 日報抜粋 */}
            {card.journalExcerpt && (
              <div className="pt-3 border-t border-[#E9E9E7]">
                <h4 className="text-xs font-semibold text-[#9B9A97] mb-1.5 uppercase tracking-wider">日報</h4>
                <p className="text-sm text-[#37352F] line-clamp-2 leading-snug">
                  {card.journalExcerpt}
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* バナーエリア（右下固定） */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {!yesterdayStatus.hasRecord && (
          <YesterdayRecordBanner yesterdayDate={yesterdayStatus.date} />
        )}
        <SuggestionBanner suggestion={suggestion} />
      </div>
    </AppLayout>
  );
}
