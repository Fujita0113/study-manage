'use client';

// レベル履歴詳細モーダル

import { GoalCard, GoalLevel, DailyRecord } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

interface LevelHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: GoalLevel | null;
  goalCards: GoalCard[];
  dailyRecords: DailyRecord[];
}

export function LevelHistoryModal({
  isOpen,
  onClose,
  level,
  goalCards,
  dailyRecords,
}: LevelHistoryModalProps) {
  // 総達成率を計算
  const achievementRate = useMemo(() => {
    if (!level || goalCards.length === 0) return 0;

    let totalDays = 0;
    let achievedDays = 0;

    goalCards.forEach((card) => {
      const startDate = new Date(card.startDate);
      const endDate = card.endDate ? new Date(card.endDate) : new Date();

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const record = dailyRecords.find((r) => r.date === dateStr);

        totalDays++;

        if (record && isAchievementMet(level, record.achievementLevel)) {
          achievedDays++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return totalDays > 0 ? Math.round((achievedDays / totalDays) * 100) : 0;
  }, [level, goalCards, dailyRecords]);

  if (!isOpen || !level) {
    return null;
  }

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

  // レベルカラー
  const getLevelColor = () => {
    switch (level) {
      case 'bronze':
        return 'text-[#CD7F32]';
      case 'silver':
        return 'text-[#94A3B8]';
      case 'gold':
        return 'text-[#F59E0B]';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="モーダルを閉じる"
      />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">
            <span className={getLevelColor()}>{getLevelName()}</span>の履歴
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="閉じる"
          >
            <XMarkIcon className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* 総達成率 */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600 mb-1">総達成率</div>
            <div className="text-3xl font-bold text-slate-800">
              {achievementRate}%
            </div>
          </div>

          {/* レベル履歴リスト */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-slate-800 mb-3">
              レベル変遷
            </h3>
            {goalCards.map((card, index) => {
              // 前のカードのtransitionTypeを取得（次のカードに表示するため）
              const previousCard = index > 0 ? goalCards[index - 1] : null;
              const transitionBadge = previousCard?.transitionType;

              return (
                <div
                  key={card.id}
                  className="p-4 bg-white border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xl font-bold ${getLevelColor()}`}>
                      Lv.{card.levelNumber}
                    </span>
                    <span className="text-sm text-slate-500">
                      {card.startDate} 〜{' '}
                      {card.endDate || '現在'}
                    </span>
                  </div>
                  <div className="text-slate-700">{card.content}</div>
                  {transitionBadge && (
                    <div className="mt-2">
                      {transitionBadge === 'level_up' ? (
                        <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          ↗️ レベルアップ
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                          ↘️ 目標調整
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 達成レベルが目標レベルを満たしているかチェック
 */
function isAchievementMet(goalLevel: GoalLevel, achievementLevel: string): boolean {
  const levelHierarchy = ['none', 'bronze', 'silver', 'gold'];
  const goalIndex = levelHierarchy.indexOf(goalLevel);
  const achievementIndex = levelHierarchy.indexOf(achievementLevel);

  return achievementIndex >= goalIndex;
}
