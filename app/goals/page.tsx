// 目標編集画面（Server Component）

import { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { getGoals } from '@/lib/db';
import { GoalsClient } from './GoalsClient';

interface GoalsPageProps {
  searchParams?: Promise<{ edit?: string }>;
}

async function GoalsPageContent({ searchParams }: GoalsPageProps) {
  const goals = await getGoals();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const editParam = resolvedSearchParams.edit || null;

  return <GoalsClient initialGoals={goals} editParam={editParam} />;
}

export default function GoalsPage({ searchParams }: GoalsPageProps) {
  return (
    <Suspense fallback={
      <AppLayout pageTitle="目標編集">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    }>
      <GoalsPageContent searchParams={searchParams} />
    </Suspense>
  );
}
