'use client';

import { GoalHistorySlot } from '@/types';
import { LockIcon } from '@/components/icons';

interface GoalSlotCardProps {
  slot: GoalHistorySlot;
  isCurrentSlot: boolean;
  currentStreak?: number;
}

export function GoalSlotCard({ slot, isCurrentSlot, currentStreak }: GoalSlotCardProps) {
  // 期間の長さを計算（カードの幅を決定）
  const duration = calculateDuration(slot.startDate, slot.endDate);
  const cardWidth = Math.max(300, duration * 20); // 最小300px、1日あたり20px

  return (
    <div
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
      style={{ minWidth: `${cardWidth}px` }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500">
            {formatDateRange(slot.startDate, slot.endDate)}
          </p>
          {isCurrentSlot && (
            <div className="flex items-center gap-2 mt-1">
              <LockIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">編集ロック中</span>
            </div>
          )}
        </div>

        {/* 現在進行中のスロットの場合、ストリーク表示 */}
        {isCurrentSlot && currentStreak !== undefined && (
          <div className="text-right">
            <p className="text-xs text-slate-500">現在のストリーク</p>
            <p className="text-lg font-bold text-blue-600">{currentStreak} / 14日</p>
          </div>
        )}
      </div>

      {/* 目標内容 */}
      <div className="space-y-3">
        <GoalItem level="Bronze" description={slot.bronzeGoal} />
        <GoalItem level="Silver" description={slot.silverGoal} />
        <GoalItem level="Gold" description={slot.goldGoal} />
      </div>
    </div>
  );
}

function GoalItem({ level, description }: { level: string; description: string }) {
  const colorClass =
    level === 'Bronze' ? 'bg-amber-100 text-amber-800' :
    level === 'Silver' ? 'bg-slate-100 text-slate-800' :
    'bg-yellow-100 text-yellow-800';

  return (
    <div>
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass} mb-1`}>
        {level}
      </span>
      <p className="text-sm text-slate-700">{description}</p>
    </div>
  );
}

/**
 * 期間の日数を計算
 */
function calculateDuration(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 日付範囲をフォーマット
 */
function formatDateRange(startDate: string, endDate?: string): string {
  const start = new Date(startDate).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric'
  });

  if (!endDate) {
    return `${start} 〜 現在`;
  }

  const end = new Date(endDate).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric'
  });

  return `${start} 〜 ${end}`;
}
