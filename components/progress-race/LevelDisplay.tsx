'use client';

// 現在のレベル表示（画面上部）

import { GoalLevel } from '@/types';

interface LevelDisplayProps {
  bronzeLevel: number;
  silverLevel: number;
  goldLevel: number;
}

export function LevelDisplay({ bronzeLevel, silverLevel, goldLevel }: LevelDisplayProps) {
  const levels = [
    { name: 'Bronze', level: bronzeLevel, color: 'text-[#CD7F32]' },
    { name: 'Silver', level: silverLevel, color: 'text-[#94A3B8]' },
    { name: 'Gold', level: goldLevel, color: 'text-[#F59E0B]' },
  ];

  return (
    <div className="flex gap-6 mb-8">
      {levels.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm"
        >
          <span className="text-slate-600 font-medium">{item.name}</span>
          <span className={`text-2xl font-bold ${item.color}`}>
            Lv.{item.level}
          </span>
        </div>
      ))}
    </div>
  );
}
