// ホーム画面（デイリーレポートカード形式）

import { AppLayout } from '@/components/layout/AppLayout';
import {
  getDailyRecords,
  getSuggestion,
  getGitHubCommits
} from '@/lib/db';
import {
  formatDate,
  getLevelColor,
  getLevelLabel
} from '@/lib/utils';
import Link from 'next/link';
import { MOCK_USER_ID } from '@/lib/mockData';
import { DailyReportCard } from '@/types';

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

  // 2. 過去7日分の記録を取得（新しい順）
  const endDate = today;
  const startDate = formatDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const records = await getDailyRecords(MOCK_USER_ID, { startDate, endDate });

  // 3. GitHubコミット履歴を取得
  const allGitHubCommits = await getGitHubCommits();

  // 4. デイリーレポートカードデータを生成（過去7日分、新しい順）
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i); // 0, -1, -2, ... -6（新しい順）
    return formatDate(date);
  });

  const dailyReportCards: DailyReportCard[] = last7Days.map(date => {
    const record = records.find(r => r.date === date);

    // その日のコミットを抽出（最大3件）
    const dayCommits = allGitHubCommits
      .filter(commit => {
        const commitDate = formatDate(new Date(commit.date));
        return commitDate === date;
      })
      .slice(0, 3);

    return {
      date,
      displayDate: formatDateDisplay(date),
      achievementLevel: record?.achievementLevel || 'none',
      commits: dayCommits,
      journalExcerpt: createJournalExcerpt(record?.journalText),
      hasRecord: !!record
    };
  });

  // 5. 提案バナーの表示判定
  const suggestion = await getSuggestion();

  // 6. 過去7日分のドットマップデータを生成（古い順）
  const last7DaysForDots = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return formatDate(date);
  });

  const last7DaysData = last7DaysForDots.map(date => {
    const record = records.find(r => r.date === date);
    return {
      date,
      achievementLevel: record?.achievementLevel || 'none',
      color: record ? getLevelColor(record.achievementLevel) : '#E5E7EB'
    };
  });

  return (
    <AppLayout pageTitle="ホーム">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* メインエリア: デイリーレポートカード一覧 */}
        <div className="flex-1 space-y-4">
          {dailyReportCards.map((card) => (
            <Link
              key={card.date}
              href={`/day/${card.date}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* 日付と達成度バッジ */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">{card.displayDate}</h3>
                <span
                  className="px-3 py-1 rounded-lg text-white text-sm font-semibold"
                  style={{ backgroundColor: getLevelColor(card.achievementLevel) }}
                >
                  {getLevelLabel(card.achievementLevel)}
                </span>
              </div>

              {/* 学習内容サマリー（GitHubコミット） */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">学習内容</h4>
                {card.commits.length === 0 ? (
                  <p className="text-sm text-slate-400">コミットなし</p>
                ) : (
                  <ul className="space-y-1">
                    {card.commits.map((commit) => (
                      <li key={commit.sha} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span className="line-clamp-1">{commit.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 日報の抜粋 */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">日報</h4>
                {card.journalExcerpt ? (
                  <p className="text-sm text-slate-600 line-clamp-2">{card.journalExcerpt}</p>
                ) : (
                  <p className="text-sm text-slate-400">日報なし</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* サイドエリア: サマリー */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
          {/* 過去7日間の達成度ビジュアライザー */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">過去7日間の達成度</h3>
            <div className="flex justify-between items-center gap-2">
              {last7DaysData.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: day.color }}
                    title={`${day.date}: ${getLevelLabel(day.achievementLevel)}`}
                  />
                  <span className="text-xs text-slate-500">
                    {new Date(day.date + 'T00:00:00').getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 提案バナー */}
          {suggestion && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-3">{suggestion.message}</p>
              <Link
                href="/goals"
                className="block w-full text-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                目標を編集する
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
