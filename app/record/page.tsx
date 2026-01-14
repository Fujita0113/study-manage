// 記録・日報画面 (Server Component)

import { calculateStreakFromRecords } from '@/lib/db';
import { MOCK_USER_ID } from '@/lib/mockData';
import { RecordPageClient } from './RecordPageClient';

export default async function RecordPage() {
  const streakDays = await calculateStreakFromRecords(MOCK_USER_ID);

  return <RecordPageClient streakDays={streakDays} />;
}
