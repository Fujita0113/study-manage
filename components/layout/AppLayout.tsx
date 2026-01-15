'use client';

// アプリケーション全体のレイアウトコンポーネント

import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  streakDays: number;
}

export function AppLayout({ children, pageTitle, streakDays }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header pageTitle={pageTitle} streakDays={streakDays} />
      <main className="ml-64 mt-16 p-6">
        <div>
          {children}
        </div>
      </main>
    </div>
  );
}

