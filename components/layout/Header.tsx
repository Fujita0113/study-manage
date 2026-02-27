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
    <div className="fixed top-0 left-60 right-0 h-12 bg-white border-b border-[#E9E9E7] flex items-center justify-between px-6 z-10 transition-all">
      {/* 左側: ページタイトル */}
      <h1 className="text-sm font-semibold text-[#37352F] hover:bg-[#EFEFED] px-2 py-1 rounded cursor-pointer">{pageTitle}</h1>

      {/* 右側: ストリーク + CTA */}
      <div className="flex items-center gap-4">
        {/* ストリーク表示 */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-md">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-medium text-orange-700">{streakDays} days</span>
        </div>

        {/* リカバリーボタン（記録未確定時のみ表示） */}
        {showRecoveryButton && (
          <button
            onClick={onRecoveryClick}
            className="px-3 py-1.5 text-xs bg-pink-500 text-white rounded-md font-medium hover:bg-pink-600 transition-colors"
          >
            リカバリー
          </button>
        )}

        {/* 今日の記録をつけるボタン */}
        <Link
          href="/record"
          className="px-3 py-1.5 text-xs bg-[#2EAADC] text-white rounded-md font-medium hover:bg-[#258AAA] transition-colors"
        >
          今日の記録をつける
        </Link>
      </div>
    </div>
  );
}





