import { TransitionType } from '@/types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransitionArrowProps {
  transitionType: TransitionType;
}

export function TransitionArrow({ transitionType }: TransitionArrowProps) {
  if (transitionType === null) {
    return null;
  }

  const isLevelUp = transitionType === 'level_up';

  return (
    <div className="flex items-center justify-center px-4">
      <div
        className={cn(
          'flex flex-col items-center gap-1',
          isLevelUp ? 'text-green-600' : 'text-red-600'
        )}
      >
        {/* 矢印アイコン */}
        {isLevelUp ? (
          <TrendingUp className="h-6 w-6" strokeWidth={3} />
        ) : (
          <TrendingDown className="h-6 w-6" strokeWidth={3} />
        )}

        {/* ラベル */}
        <span className="text-xs font-semibold whitespace-nowrap">
          {isLevelUp ? '14日連続達成' : '目標調整'}
        </span>
      </div>
    </div>
  );
}
