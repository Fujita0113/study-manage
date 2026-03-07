import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/AppLayout';
import { getTimelineTodosAction } from '@/lib/actions/timeline';
import TimelineClient from './_components/TimelineClient';
import { Metadata } from 'next';
import { calculateStreakFromRecords } from '@/lib/db';

export const metadata: Metadata = {
    title: 'マイルーティン | Pepper Dev Journal',
    description: '理想の一日のルーティンを管理',
};

export default function RoutinePage() {
    return <RoutineContent />;
}

async function RoutineContent() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch initial data
    const [timelineTodos, streakDays] = await Promise.all([
        getTimelineTodosAction(user.id),
        calculateStreakFromRecords(user.id)
    ]);

    return (
        <AppLayout pageTitle="マイルーティン" streakDays={streakDays}>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">マイルーティン</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        理想の一日のルーティンを作成・管理して、より充実した開発ライフを送りましょう
                    </p>
                </div>

                <TimelineClient
                    initialTodos={timelineTodos}
                    userId={user.id}
                />
            </div>
        </AppLayout>
    );
}
