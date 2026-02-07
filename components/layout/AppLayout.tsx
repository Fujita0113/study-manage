'use client';

// アプリケーション全体のレイアウトコンポーネント

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RecoveryConfirmDialog, RecoveryModeBanner } from '@/components/recovery';
import { RecoveryModeStatus } from '@/types';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  streakDays: number;
  recoveryStatus?: RecoveryModeStatus;
  canShowRecoveryButton?: boolean;
}

export function AppLayout({
  children,
  pageTitle,
  streakDays,
  recoveryStatus,
  canShowRecoveryButton
}: AppLayoutProps) {
  const router = useRouter();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [isActivatingRecovery, setIsActivatingRecovery] = useState(false);

  const handleRecoveryClick = () => {
    setShowRecoveryDialog(true);
  };

  const handleRecoveryConfirm = async () => {
    setIsActivatingRecovery(true);
    try {
      const response = await fetch('/api/recovery-mode', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'リカバリーモードの起動に失敗しました');
        return;
      }

      setShowRecoveryDialog(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to activate recovery mode:', error);
      alert('リカバリーモードの起動に失敗しました');
    } finally {
      setIsActivatingRecovery(false);
    }
  };

  const handleRecoveryCancel = () => {
    setShowRecoveryDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header
        pageTitle={pageTitle}
        streakDays={streakDays}
        recoveryStatus={recoveryStatus}
        canShowRecoveryButton={canShowRecoveryButton}
        onRecoveryClick={handleRecoveryClick}
      />

      {/* リカバリーモードバナー（モード中のみ表示） */}
      {recoveryStatus?.isActive && recoveryStatus?.goal && (
        <div className="fixed top-16 left-64 right-0 z-10">
          <RecoveryModeBanner recoveryGoal={recoveryStatus.goal} />
        </div>
      )}

      <main className={`ml-64 mt-16 p-6 ${recoveryStatus?.isActive ? 'pt-20' : ''}`}>
        <div>
          {children}
        </div>
      </main>

      {/* リカバリー起動確認ダイアログ */}
      <RecoveryConfirmDialog
        isOpen={showRecoveryDialog}
        recoveryGoal={recoveryStatus?.goal || ''}
        onConfirm={handleRecoveryConfirm}
        onCancel={handleRecoveryCancel}
        isLoading={isActivatingRecovery}
      />
    </div>
  );
}

