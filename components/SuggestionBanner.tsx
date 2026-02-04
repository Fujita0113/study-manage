'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Suggestion } from '@/types';
import { XIcon } from '@/components/icons';

interface SuggestionBannerProps {
  suggestion: Suggestion | null;
}

export function SuggestionBanner({ suggestion }: SuggestionBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!suggestion || !isVisible) {
    return null;
  }

  const bgColor = suggestion.type === 'level_up'
    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
    : 'bg-gradient-to-r from-blue-500 to-indigo-500';

  // 編集権限パラメータを構築
  // Bronze達成 → edit=bronze (Bronzeのみ)
  // Silver達成 → edit=silver (Bronze + Silver)
  // Gold達成 → edit=gold (全て)
  // レベルダウン → edit=all (全て)
  const editParam = suggestion.canEditAllGoals ? 'all' : suggestion.targetLevel;
  const goalsUrl = `/goals?edit=${editParam}`;

  return (
    <div className={`${bgColor} text-white rounded-lg shadow-2xl p-4 max-w-sm animate-slide-up relative`}>
      {/* 閉じるボタン */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        aria-label="閉じる"
      >
        <XIcon className="w-4 h-4" />
      </button>

      {/* メッセージ */}
      <div className="pr-6 mb-3">
        <p className="text-sm font-medium leading-relaxed">
          {suggestion.message}
        </p>
      </div>

      {/* アクションボタン */}
      <Link
        href={goalsUrl}
        className="block w-full bg-white text-center py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors"
        style={{ color: suggestion.type === 'level_up' ? '#F59E0B' : '#4F46E5' }}
      >
        目標を編集する
      </Link>
    </div>
  );
}
