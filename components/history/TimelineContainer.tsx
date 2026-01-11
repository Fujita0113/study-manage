'use client';

import { useEffect, useRef } from 'react';
import { GoalCard as GoalCardType, GoalHistory } from '@/types';
import { GoalCard } from './GoalCard';
import { TransitionArrow } from './TransitionArrow';
import { differenceInDays, parseISO } from 'date-fns';

interface TimelineContainerProps {
  goalHistory: GoalHistory;
}

// 1日あたりのピクセル数
const PIXELS_PER_DAY = 10;

// カード間のギャップ（px）
const CARD_GAP = 8;

// カードの高さ（px）
const CARD_HEIGHT = 160;

// レーン間のギャップ（px）
const LANE_GAP = 16;

// 日数をピクセルに変換
function calculateCardWidth(startDate: string, endDate: string | null): number {
  const start = parseISO(startDate);
  const end = endDate ? parseISO(endDate) : new Date();
  const days = differenceInDays(end, start) + 1; // 開始日を含むため+1
  return Math.max(days * PIXELS_PER_DAY, 100); // 最小幅100px
}

// カードの開始位置を計算（基準日からの日数）
function calculateCardPosition(startDate: string, baseDate: string): number {
  const start = parseISO(startDate);
  const base = parseISO(baseDate);
  return differenceInDays(start, base) * PIXELS_PER_DAY;
}

// 最も古い開始日を取得
function getBaseDate(goalHistory: GoalHistory): string {
  const allCards = [
    ...goalHistory.bronze,
    ...goalHistory.silver,
    ...goalHistory.gold,
  ];

  if (allCards.length === 0) {
    return new Date().toISOString().split('T')[0];
  }

  const dates = allCards.map(card => card.startDate).sort();
  return dates[0];
}

// タイムラインの全体幅を計算
function calculateTotalWidth(goalHistory: GoalHistory, baseDate: string): number {
  const allCards = [
    ...goalHistory.bronze,
    ...goalHistory.silver,
    ...goalHistory.gold,
  ];

  if (allCards.length === 0) {
    return 1000; // デフォルト幅
  }

  // 最も右端のカードの終了位置を計算
  let maxEndPosition = 0;

  allCards.forEach(card => {
    const position = calculateCardPosition(card.startDate, baseDate);
    const width = calculateCardWidth(card.startDate, card.endDate);
    const endPosition = position + width;
    maxEndPosition = Math.max(maxEndPosition, endPosition);
  });

  return maxEndPosition + 100; // 右側に余白を追加
}

// カードレーンをレンダリング
function renderCardLane(
  cards: GoalCardType[],
  baseDate: string,
  laneLabel: string
): React.JSX.Element {
  return (
    <div className="relative" style={{ height: `${CARD_HEIGHT}px` }}>
      {/* レーンラベル */}
      <div className="absolute left-0 top-0 font-semibold text-sm text-gray-700 z-10">
        {laneLabel}
      </div>

      {/* カードと矢印を横に並べる */}
      <div className="absolute left-0 top-6 flex items-center gap-0">
        {cards.map((card, index) => {
          const position = calculateCardPosition(card.startDate, baseDate);
          const width = calculateCardWidth(card.startDate, card.endDate);
          const showArrow = index < cards.length - 1 && card.transitionType !== null;

          return (
            <div key={card.id} className="flex items-center" style={{ marginLeft: index === 0 ? `${position}px` : '0' }}>
              <GoalCard card={card} width={width} />
              {showArrow && <TransitionArrow transitionType={card.transitionType} />}
              {!showArrow && index < cards.length - 1 && <div style={{ width: `${CARD_GAP}px` }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimelineContainer({ goalHistory }: TimelineContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const baseDate = getBaseDate(goalHistory);
  const totalWidth = calculateTotalWidth(goalHistory, baseDate);

  // 初期表示位置を最新のカード（一番右）に設定
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // 右端にスクロール
      container.scrollLeft = container.scrollWidth - container.clientWidth;
    }
  }, []);

  // カードが存在しない場合
  if (
    goalHistory.bronze.length === 0 &&
    goalHistory.silver.length === 0 &&
    goalHistory.gold.length === 0
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">まだ目標変更履歴がありません</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="overflow-x-auto overflow-y-hidden pb-4"
      style={{ width: '100%' }}
    >
      <div
        className="flex flex-col gap-4"
        style={{
          width: `${totalWidth}px`,
          paddingTop: '16px',
          paddingBottom: '16px',
        }}
      >
        {/* Bronze レーン */}
        {goalHistory.bronze.length > 0 && (
          <div style={{ marginBottom: `${LANE_GAP}px` }}>
            {renderCardLane(goalHistory.bronze, baseDate, 'Bronze')}
          </div>
        )}

        {/* Silver レーン */}
        {goalHistory.silver.length > 0 && (
          <div style={{ marginBottom: `${LANE_GAP}px` }}>
            {renderCardLane(goalHistory.silver, baseDate, 'Silver')}
          </div>
        )}

        {/* Gold レーン */}
        {goalHistory.gold.length > 0 && (
          <div>
            {renderCardLane(goalHistory.gold, baseDate, 'Gold')}
          </div>
        )}
      </div>
    </div>
  );
}
