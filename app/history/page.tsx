import { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout';
import { calculateStreakFromRecords } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import HistoryCharts from './_components/HistoryCharts';

export const metadata: Metadata = {
  title: '履歴 | 学習管理',
  description: '学習記録の履歴を可視化',
};

export default async function HistoryPage() {
  // 認証チェックとユーザー情報の取得
  const user = await requireAuth();

  // ストリーク計算
  const streakDays = await calculateStreakFromRecords(user.id);

  return (
    <AppLayout pageTitle="履歴" streakDays={streakDays}>
      <HistoryCharts />
    </AppLayout>
  );
}
