'use client';

// 個別のレベルバー（横棒グラフ）

import { GoalLevel } from '@/types';
import { LevelFrameState } from '@/lib/animation/types';

interface RaceBarProps {
  level: GoalLevel;
  frameState: LevelFrameState;
  maxDays?: number; // デフォルト: 14
}

export function RaceBar({ level, frameState, maxDays = 14 }: RaceBarProps) {
  const { levelNumber, goalContent, days } = frameState;

  // レベルに応じた色を取得
  const getBarColor = () => {
    switch (level) {
      case 'bronze':
        return 'bg-[#CD7F32]'; // Bronze
      case 'silver':
        return 'bg-[#94A3B8]'; // Silver
      case 'gold':
        return 'bg-[#F59E0B]'; // Gold
      default:
        return 'bg-gray-300';
    }
  };

  // レベル名を取得
  const getLevelName = () => {
    switch (level) {
      case 'bronze':
        return 'Bronze';
      case 'silver':
        return 'Silver';
      case 'gold':
        return 'Gold';
      default:
        return '';
    }
  };

  // バーの幅を計算（0〜100%）
  const barWidth = (days / maxDays) * 100;

  return (
    <div className="flex items-center gap-4 mb-6">
      {/* ラベル部分 */}
      <div className="min-w-[200px]">
        <button
          className="text-left hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors w-full"
          aria-label={`${getLevelName()}の履歴を表示`}
        >
          <div className="font-bold text-lg text-slate-800">
            {getLevelName()} Lv.{levelNumber}
          </div>
          <div className="text-sm text-slate-600 mt-1">
            {goalContent}
          </div>
        </button>
      </div>

      {/* バー部分 */}
      <div className="flex-1">
        <div className="relative h-12 bg-slate-200 rounded-full overflow-hidden">
          {/* プログレスバー */}
          <div
            className={`h-full ${getBarColor()} transition-all duration-300 ease-out`}
            style={{ width: `${barWidth}%` }}
          />

          {/* 日数表示 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-white text-sm drop-shadow-md">
              {days} / {maxDays} 日
            </span>
          </div>
        </div>

        {/* 目盛り（0, 7, 14） */}
        <div className="relative flex justify-between mt-1 text-xs text-slate-500">
          <span>0</span>
          <span>7</span>
          <span>14</span>
        </div>
      </div>
    </div>
  );
}
