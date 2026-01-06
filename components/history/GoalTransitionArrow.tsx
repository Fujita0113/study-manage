'use client';

import { GoalChangeReason } from '@/types';

interface GoalTransitionArrowProps {
  changeReason: GoalChangeReason;
}

export function GoalTransitionArrow({ changeReason }: GoalTransitionArrowProps) {
  const config = getArrowConfig(changeReason);

  return (
    <div className="flex flex-col items-center justify-center px-4">
      {/* 矢印 */}
      <div className={`text-4xl ${config.color}`}>
        {config.arrow}
      </div>

      {/* ラベル */}
      <p className={`text-xs font-medium mt-2 ${config.textColor} whitespace-nowrap`}>
        {config.label}
      </p>
    </div>
  );
}

function getArrowConfig(reason: GoalChangeReason) {
  switch (reason) {
    case 'bronze_14days':
    case 'silver_14days':
    case 'gold_14days':
      return {
        arrow: '↗️',
        label: '14日連続達成',
        color: 'text-green-500',
        textColor: 'text-green-700',
      };
    case '7days_4fails':
      return {
        arrow: '↘️',
        label: '目標調整',
        color: 'text-orange-500',
        textColor: 'text-orange-700',
      };
    default:
      return {
        arrow: '→',
        label: '目標変更',
        color: 'text-slate-400',
        textColor: 'text-slate-600',
      };
  }
}
