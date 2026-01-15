// 目標変遷画面 (Server Component)

import { calculateStreakFromRecords } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import { HistoryPageClient } from './HistoryPageClient';

export default async function HistoryPage() {
  const user = await requireAuth();
  const streakDays = await calculateStreakFromRecords(user.id);

  return <HistoryPageClient streakDays={streakDays} />;
}
