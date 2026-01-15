'use client';

// 設定画面 (Client Component)

import { AppLayout } from '@/components/layout/AppLayout';
import { signOut } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SettingsPageClientProps {
  streakDays: number;
}

export function SettingsPageClient({ streakDays }: SettingsPageClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) {
      return;
    }

    setLoading(true);
    const result = await signOut();

    if (result.error) {
      alert('ログアウトに失敗しました。もう一度お試しください。');
      setLoading(false);
      return;
    }

    router.push('/login');
    router.refresh();
  };

  return (
    <AppLayout pageTitle="設定" streakDays={streakDays}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ルール確認 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">ルール確認</h2>
          <p className="text-sm text-slate-600 mb-4">
            このアプリでは、以下のルールで目標のレベルアップ・レベルダウンを提案します。
          </p>

          <div className="space-y-3">
            <div className="border-l-4 border-green-500 bg-green-50 p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                レベルアップ提案
              </h3>
              <p className="text-sm text-green-700">
                同じレベルを14日連続で達成した場合、目標をレベルアップすることを提案します。
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                レベルダウン提案
              </h3>
              <p className="text-sm text-yellow-700">
                Bronze未達が4日以上続いた場合、目標をレベルダウンすることを提案します。無理のないペースで続けることが大切です。
              </p>
            </div>
          </div>
        </div>

        {/* ログアウト */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">アカウント</h2>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}




