'use client';

// アプリケーション全体のレイアウトコンポーネント

import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function AppLayout({ children, pageTitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header pageTitle={pageTitle} />
      <main className="ml-64 mt-16 p-6">
        <div>
          {children}
        </div>
      </main>
    </div>
  );
}

