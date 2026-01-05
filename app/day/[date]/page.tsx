// 日詳細画面（実装計画書に従った実装）

import { AppLayout } from '@/components/layout/AppLayout';
import { getDailyRecordWithDetails } from '@/lib/db';
import {
  formatDateJP,
  getLevelLabel,
  getLevelBadgeClass,
  getExecutedLabel,
  getEffectivenessLabel,
  getNextActionLabel
} from '@/lib/utils';
import Link from 'next/link';

interface DayDetailPageProps {
  params: Promise<{ date: string }> | { date: string };
}

export default async function DayDetailPage({ params }: DayDetailPageProps) {
  // Next.js 15対応: paramsがPromiseの場合はawaitする
  const resolvedParams = 'then' in params ? await params : params;
  const { date } = resolvedParams;

  // 日付の記録を取得
  const record = await getDailyRecordWithDetails(date);

  if (!record) {
    return (
      <AppLayout pageTitle="日詳細">
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

  return (
    <AppLayout pageTitle={`${formatDateJP(date)} の記録`}>
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

        {/* 工夫の評価 */}
        {record.effortEvaluations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">工夫の評価</h2>
            <div className="space-y-4">
              {record.effortEvaluations.map(evaluation => (
                <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-slate-800">{evaluation.effort.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${getLevelBadgeClass(
                        evaluation.effort.goalLevel
                      )}`}
                    >
                      {evaluation.effort.goalLevel}
                    </span>
                  </div>
                  {evaluation.effort.description && (
                    <p className="text-sm text-slate-600 mb-3">{evaluation.effort.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">実行:</span>
                      <span className="text-slate-800 font-medium">
                        {getExecutedLabel(evaluation.executed)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">効果:</span>
                      <span className="text-slate-800 font-medium">
                        {getEffectivenessLabel(evaluation.effectiveness)}
                      </span>
                    </div>
                    {evaluation.nextAction && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">次回:</span>
                        <span className="text-slate-800 font-medium">
                          {getNextActionLabel(evaluation.nextAction)}
                        </span>
                      </div>
                    )}
                    {evaluation.reason && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-slate-700">{evaluation.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step-Up Strategy */}
        {record.stepUpStrategy && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              次のレベルへの架け橋（Step-Up Strategy）
            </h2>
            <p className="text-slate-700 whitespace-pre-wrap">{record.stepUpStrategy}</p>
          </div>
        )}

        {/* Journal */}
        {record.journalText && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              自由記述 / 今日のひとこと
            </h2>
            <p className="text-slate-700 whitespace-pre-wrap">{record.journalText}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
