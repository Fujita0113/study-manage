// ホーム画面（デイリーレポートカード形式）

import { AppLayout } from '@/components/layout/AppLayout';
import {
  getDailyRecords,
  getSuggestion,
  calculateStreakFromRecords
} from '@/lib/db';
import {
  formatDate,
  getLevelColor,
  getLevelLabel
} from '@/lib/utils';
import Link from 'next/link';
import { MOCK_USER_ID } from '@/lib/mockData';
import { DailyReportCard } from '@/types';
import { SuggestionBanner } from '@/components/SuggestionBanner';

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

export default async function HomePage() {
  // 1. 今日の日付を取得
  const today = formatDate(new Date());

  // 2. 過去14日分の記録を取得
  const endDate = today;
  const startDate = formatDate(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000));
  const records = await getDailyRecords(MOCK_USER_ID, { startDate, endDate });

  // 3. デイリーレポートカードデータを生成（記録がある日のみ、新しい順）
  const dailyReportCards: DailyReportCard[] = records
    .map(record => {
      // doTextから学習内容を抽出（改行区切り、最大3件）
      const learningItems = record.doText
        ? record.doText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .slice(0, 3)
        : [];

      return {
        date: record.date,
        displayDate: formatDateDisplay(record.date),
        achievementLevel: record.achievementLevel,
        learningItems,
        journalExcerpt: createJournalExcerpt(record.journalText),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // 新しい順

  // 4. 提案バナーの表示判定
  const suggestion = await getSuggestion();

  // 5. ストリークを計算
  const streakDays = await calculateStreakFromRecords(MOCK_USER_ID);

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

            {/* 学習内容 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">学習内容</h4>
              {card.learningItems.length === 0 ? (
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
