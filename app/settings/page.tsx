// 設定画面 (Server Component)

import { calculateStreakFromRecords } from '@/lib/db';
import { MOCK_USER_ID } from '@/lib/mockData';
import { SettingsPageClient } from './SettingsPageClient';

export default async function SettingsPage() {
  const streakDays = await calculateStreakFromRecords(MOCK_USER_ID);

  return <SettingsPageClient streakDays={streakDays} />;
}
