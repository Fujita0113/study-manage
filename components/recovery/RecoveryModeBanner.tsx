'use client';

import Link from 'next/link';

interface RecoveryModeBannerProps {
  recoveryGoal: string;
}

export function RecoveryModeBanner({ recoveryGoal }: RecoveryModeBannerProps) {
  return (
    <div className="bg-pink-50 border-b border-pink-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-pink-500 text-lg">♥</span>
          <span className="text-sm text-pink-700">
            <span className="font-medium">リカバリーモード中:</span> {recoveryGoal}
          </span>
        </div>
        <Link
          href="/record"
          className="text-sm text-pink-600 hover:text-pink-800 font-medium underline"
        >
          記録画面へ
        </Link>
      </div>
    </div>
  );
}
