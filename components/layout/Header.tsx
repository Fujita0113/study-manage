'use client';

// ヘッダーコンポーネント

import Link from 'next/link';
import { RecoveryModeStatus } from '@/types';

interface HeaderProps {
  pageTitle: string;
  streakDays: number;
  recoveryStatus?: RecoveryModeStatus;
  canShowRecoveryButton?: boolean;
  onRecoveryClick?: () => void;
}

export function Header({
  pageTitle,
  streakDays,
  recoveryStatus,
  canShowRecoveryButton,
  onRecoveryClick
}: HeaderProps) {
  const showRecoveryButton = canShowRecoveryButton && recoveryStatus?.goal && !recoveryStatus?.isActive;

  return (
    <div className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-[#E9E9E7] flex items-center justify-between px-6 z-10">
      {/* 左側: ページタイトル */}
      <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>

      {/* 右側: ストリーク + CTA */}
      <div className="flex items-center gap-4">
        {/* ストリーク表示 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-medium text-orange-700">{streakDays} days</span>
        </div>

        {/* リカバリーボタン（記録未確定時のみ表示） */}
        {showRecoveryButton && (
          <button
            onClick={onRecoveryClick}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors"
          >
            リカバリー
          </button>
        )}

        {/* 今日の記録をつけるボタン */}
        <Link
          href="/record"
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          今日の記録をつける
        </Link>
      </div>
    </div>
  );
}





