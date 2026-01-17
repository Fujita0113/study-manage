// 記録・日報画面 (Server Component)

import { calculateStreakFromRecords } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import { RecordPageClient } from './RecordPageClient';

export default async function RecordPage() {
  const user = await requireAuth();
  const streakDays = await calculateStreakFromRecords(user.id);

  return <RecordPageClient streakDays={streakDays} />;
}
