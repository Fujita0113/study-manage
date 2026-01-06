'use client';

// 目標変遷画面

import { AppLayout } from '@/components/layout/AppLayout';
import { TimelineContainer } from '@/components/history/TimelineContainer';
import { useAppState } from '@/lib/store';

export default function HistoryPage() {
  const { getGoalHistory } = useAppState();
  const goalHistory = getGoalHistory();

  return (
    <AppLayout pageTitle="目標変遷">
      <div className="pb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">目標変遷タイムライン</h1>

        <p className="text-slate-600 mb-6">
          各目標レベル（Bronze/Silver/Gold）の変遷を時系列で確認できます。
          横スクロールして過去の履歴を閲覧してください。
        </p>

        {/* タイムラインコンテナ */}
        <TimelineContainer goalHistory={goalHistory} />
      </div>
    </AppLayout>
  );
}
