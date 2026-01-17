// 目標編集画面（Server Component）

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getGoals, calculateStreakFromRecords } from '@/lib/db';
import { requireAuth } from '@/lib/auth/server';
import { GoalsClient } from './GoalsClient';

interface GoalsPageProps {
  searchParams?: Promise<{ edit?: string }>;
}

async function GoalsPageContent({ searchParams }: GoalsPageProps) {
  const user = await requireAuth();
  const goals = await getGoals(user.id);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const editParam = resolvedSearchParams.edit || null;
  const streakDays = await calculateStreakFromRecords(user.id);

  return <GoalsClient initialGoals={goals} editParam={editParam} streakDays={streakDays} />;
}

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const user = await requireAuth();
  const streakDays = await calculateStreakFromRecords(user.id);

  return (
    <Suspense fallback={
      <AppLayout pageTitle="目標編集" streakDays={streakDays}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    }>
      <GoalsPageContent searchParams={searchParams} />
    </Suspense>
  );
}
