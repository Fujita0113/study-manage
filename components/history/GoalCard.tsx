import { GoalCard as GoalCardType, GoalLevel } from '@/types';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  card: GoalCardType;
  width: number; // カード幅（px）
}

// 目標レベルに応じた色を返す
function getLevelColor(level: GoalLevel): string {
  switch (level) {
    case 'bronze':
      return 'border-[#CD7F32] bg-[#CD7F32]/5';
    case 'silver':
      return 'border-[#94A3B8] bg-[#94A3B8]/5';
    case 'gold':
      return 'border-[#F59E0B] bg-[#F59E0B]/5';
  }
}

// 目標レベルに応じたラベル色を返す
function getLevelLabelColor(level: GoalLevel): string {
  switch (level) {
    case 'bronze':
      return 'bg-[#CD7F32] text-white';
    case 'silver':
      return 'bg-[#94A3B8] text-white';
    case 'gold':
      return 'bg-[#F59E0B] text-white';
  }
}

// 目標レベルのラベルテキスト
function getLevelLabel(level: GoalLevel): string {
  switch (level) {
    case 'bronze':
      return 'Bronze';
    case 'silver':
      return 'Silver';
    case 'gold':
      return 'Gold';
  }
}

export function GoalCard({ card, width }: GoalCardProps) {
  const isActive = card.endDate === null;

  return (
    <div
      className={cn(
        'rounded-lg border-2 shadow-md p-4 flex flex-col gap-2',
        getLevelColor(card.level)
      )}
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      {/* 目標レベルラベル */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'px-2 py-1 rounded text-xs font-semibold',
            getLevelLabelColor(card.level)
          )}
        >
          {getLevelLabel(card.level)}
        </span>
        {isActive && (
          <Lock className="h-4 w-4 text-gray-500" />
        )}
      </div>

      {/* 目標内容 */}
      <p className="text-sm font-medium text-gray-900">{card.content}</p>

      {/* 実施期間 */}
      <p className="text-xs text-gray-500">
        {card.startDate} 〜 {card.endDate || '現在'}
      </p>

      {/* 現在進行中の場合、進捗インジケーター */}
      {isActive && card.currentStreak !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            現在のストリーク: <span className="font-semibold">{card.currentStreak} 日 / 14 日</span>
          </p>
          {/* 進捗バー */}
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(card.currentStreak / 14) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
