// 目標変遷画面 (Server Component)

import { calculateStreakFromRecords } from '@/lib/db';
import { MOCK_USER_ID } from '@/lib/mockData';
import { HistoryPageClient } from './HistoryPageClient';

export default async function HistoryPage() {
  const streakDays = await calculateStreakFromRecords(MOCK_USER_ID);

  return <HistoryPageClient streakDays={streakDays} />;
}
