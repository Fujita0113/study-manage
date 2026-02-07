// 設定画面 (Server Component)

import { calculateStreakFromRecords, getRecoveryModeStatus } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import { SettingsPageClient } from './SettingsPageClient';

export default async function SettingsPage() {
  const user = await requireAuth();
  const streakDays = await calculateStreakFromRecords(user.id);
  const recoveryStatus = await getRecoveryModeStatus(user.id);

  return (
    <SettingsPageClient
      streakDays={streakDays}
      initialRecoveryGoal={recoveryStatus.goal || undefined}
      isRecoveryModeActive={recoveryStatus.isActive}
    />
  );
}
