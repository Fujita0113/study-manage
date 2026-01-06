// ユーティリティ関数

import type { GoalLevel, AchievementLevel } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS classes merger utility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * YYYY-MM-DD 形式の文字列を Date オブジェクトに変換
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
 * 日付を日本語形式で表示（例: 2024/01/15）
 */
export function formatDateJP(dateString: string): string {
  const date = parseDate(dateString);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 日付と時刻を日本語形式で表示（例: 2024/01/15 14:30）
 */
export function formatDateTimeJP(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * レベルの色を取得
 */
export function getLevelColor(level: AchievementLevel): string {
  switch (level) {
    case 'none':
      return '#E5E7EB'; // Gray 200
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#94A3B8'; // Slate 400
    case 'gold':
      return '#F59E0B'; // Amber 500
    default:
      return '#E5E7EB';
  }
}

/**
 * レベルのバッジクラスを取得（Tailwind）
 */
export function getLevelBadgeClass(level: AchievementLevel | GoalLevel): string {
  switch (level) {
    case 'none':
      return 'bg-gray-200 text-gray-700';
    case 'bronze':
      return 'bg-[#CD7F32] text-white';
    case 'silver':
      return 'bg-slate-400 text-white';
    case 'gold':
      return 'bg-amber-500 text-white';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}

/**
 * レベルの表示名を取得
 */
export function getLevelLabel(level: AchievementLevel | GoalLevel): string {
  switch (level) {
    case 'none':
      return '未記録';
    case 'bronze':
      return 'Bronze';
    case 'silver':
      return 'Silver';
    case 'gold':
      return 'Gold';
    default:
      return '';
  }
}

/**
 * 月の最初の日と最後の日を取得
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start, end };
}

/**
 * 月のすべての日付を取得
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const { start, end } = getMonthRange(year, month);
  
  for (let i = 1; i <= end.getDate(); i++) {
    days.push(new Date(year, month - 1, i));
  }
  
  return days;
}

/**
 * 今日の日付を取得（YYYY-MM-DD形式）
 */
export function getTodayDate(): string {
  return formatDate(new Date());
}

/**
 * 一意のIDを生成
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 日付を短縮形式で表示（例: 12/30（火））
 */
export function formatDateShort(dateString: string): string {
  const date = parseDate(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day}（${weekday}）`;
}

