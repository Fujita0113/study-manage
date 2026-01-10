// アニメーションフレーム生成ロジック

import { GoalHistory, GoalCard, DailyRecord, GoalLevel } from '@/types';
import { AnimationFrame, LevelFrameState } from './types';

/**
 * GoalHistoryとDailyRecordsからアニメーションフレームを生成する
 *
 * @param goalHistory 目標変遷履歴
 * @param dailyRecords 日次記録（日付順）
 * @returns アニメーションフレームの配列
 */
export function generateAnimationFrames(
  goalHistory: GoalHistory,
  dailyRecords: DailyRecord[]
): AnimationFrame[] {
  // 全ての日付を抽出（最も古い日から最新の日まで）
  const allDates = extractAllDates(goalHistory, dailyRecords);

  // 各日付ごとにフレームを生成
  const frames: AnimationFrame[] = allDates.map(date => {
    return {
      date,
      bronze: generateLevelFrameState('bronze', date, goalHistory.bronze, dailyRecords),
      silver: generateLevelFrameState('silver', date, goalHistory.silver, dailyRecords),
      gold: generateLevelFrameState('gold', date, goalHistory.gold, dailyRecords),
    };
  });

  return frames;
}

/**
 * 全ての関連する日付を抽出する
 */
function extractAllDates(goalHistory: GoalHistory, dailyRecords: DailyRecord[]): string[] {
  const dates = new Set<string>();

  // GoalHistoryから日付を抽出
  [...goalHistory.bronze, ...goalHistory.silver, ...goalHistory.gold].forEach(card => {
    const startDate = new Date(card.startDate);
    const endDate = card.endDate ? new Date(card.endDate) : new Date();

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.add(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  // DailyRecordsから日付を抽出
  dailyRecords.forEach(record => {
    dates.add(record.date);
  });

  // 日付を昇順にソート
  return Array.from(dates).sort();
}

/**
 * 特定のレベルの特定の日のフレーム状態を生成
 */
function generateLevelFrameState(
  level: GoalLevel,
  date: string,
  goalCards: GoalCard[],
  dailyRecords: DailyRecord[]
): LevelFrameState {
  // その日時点で有効なGoalCardを見つける
  const activeCard = findActiveCardForDate(date, goalCards);

  if (!activeCard) {
    // カードが見つからない場合はデフォルト値を返す
    return {
      level,
      levelNumber: 0,
      goalContent: '',
      days: 0,
      isLevelUp: false,
      isLevelDown: false,
    };
  }

  // その日までの連続達成日数を計算
  const daysCount = calculateDaysCount(level, date, activeCard, dailyRecords);

  // レベルアップ・レベルダウンの判定
  const isLevelUp = checkIsLevelUp(date, activeCard);
  const isLevelDown = checkIsLevelDown(date, activeCard);

  return {
    level,
    levelNumber: activeCard.levelNumber,
    goalContent: activeCard.content,
    days: daysCount,
    isLevelUp,
    isLevelDown,
  };
}

/**
 * 指定された日付に有効なGoalCardを見つける
 */
function findActiveCardForDate(date: string, goalCards: GoalCard[]): GoalCard | null {
  return goalCards.find(card => {
    const cardStart = card.startDate;
    const cardEnd = card.endDate || '9999-12-31'; // 終了日がない場合は遠い未来
    return date >= cardStart && date <= cardEnd;
  }) || null;
}

/**
 * その日までの連続達成日数を計算（0〜14）
 */
function calculateDaysCount(
  level: GoalLevel,
  date: string,
  activeCard: GoalCard,
  dailyRecords: DailyRecord[]
): number {
  const startDate = new Date(activeCard.startDate);
  const targetDate = new Date(date);

  let count = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= targetDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const record = dailyRecords.find(r => r.date === dateStr);

    if (record && isAchievementMet(level, record.achievementLevel)) {
      count++;
      // 14日を超えたらリセット（レベルアップの場合）
      if (count > 14) {
        count = 1; // 新しい期間の1日目
      }
    } else if (record && record.achievementLevel === 'none') {
      // 未達成の場合はカウントをリセットしない（そのまま継続）
      // レベルダウンの判定は別で行う
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return Math.min(count, 14); // 最大14日
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

/**
 * その日がレベルアップの日かチェック
 */
function checkIsLevelUp(date: string, activeCard: GoalCard): boolean {
  // カードの終了日がその日で、次のカードへの遷移がlevel_upの場合
  return activeCard.endDate === date && activeCard.transitionType === 'level_up';
}

/**
 * その日がレベルダウンの日かチェック
 */
function checkIsLevelDown(date: string, activeCard: GoalCard): boolean {
  // カードの終了日がその日で、次のカードへの遷移がlevel_downの場合
  return activeCard.endDate === date && activeCard.transitionType === 'level_down';
}
