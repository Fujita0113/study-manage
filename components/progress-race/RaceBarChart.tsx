'use client';

// デッドヒート表示（3本のバーをまとめて表示）

import { AnimationFrame } from '@/lib/animation/types';
import { RaceBar } from './RaceBar';
import { LevelUpEffect } from './LevelUpEffect';

interface RaceBarChartProps {
  currentFrame: AnimationFrame | null;
  onBarClick?: (level: 'bronze' | 'silver' | 'gold') => void;
}

export function RaceBarChart({ currentFrame, onBarClick }: RaceBarChartProps) {
  if (!currentFrame) {
    return (
      <div className="text-center text-slate-500 py-12">
        データがありません
      </div>
    );
  }

  const { bronze, silver, gold } = currentFrame;

  // エフェクト表示の判定
  const effectType = bronze.isLevelUp || silver.isLevelUp || gold.isLevelUp
    ? 'level_up'
    : bronze.isLevelDown || silver.isLevelDown || gold.isLevelDown
    ? 'level_down'
    : null;

  return (
    <div className="relative">
      {/* エフェクト表示 */}
      {effectType && <LevelUpEffect type={effectType} />}

      {/* バー表示 */}
      <div className="space-y-4">
        <div onClick={() => onBarClick?.('bronze')}>
          <RaceBar level="bronze" frameState={bronze} />
        </div>
        <div onClick={() => onBarClick?.('silver')}>
          <RaceBar level="silver" frameState={silver} />
        </div>
        <div onClick={() => onBarClick?.('gold')}>
          <RaceBar level="gold" frameState={gold} />
        </div>
      </div>
    </div>
  );
}
