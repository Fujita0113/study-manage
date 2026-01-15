// 目標編集画面（Server Component）

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getGoals, calculateStreakFromRecords } from '@/lib/db';
import { GoalsClient } from './GoalsClient';
import { MOCK_USER_ID } from '@/lib/mockData';

interface GoalsPageProps {
  searchParams?: Promise<{ edit?: string }>;
}

async function GoalsPageContent({ searchParams }: GoalsPageProps) {
  const goals = await getGoals();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const editParam = resolvedSearchParams.edit || null;
  const streakDays = await calculateStreakFromRecords(MOCK_USER_ID);

  return <GoalsClient initialGoals={goals} editParam={editParam} streakDays={streakDays} />;
}

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const streakDays = await calculateStreakFromRecords(MOCK_USER_ID);

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
