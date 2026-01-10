// アニメーション関連の型定義

import { GoalLevel } from '@/types';

/**
 * 各フレームでの各レベルの状態
 */
export interface LevelFrameState {
  level: GoalLevel;
  levelNumber: number; // Lv.1, Lv.2, ...
  goalContent: string; // 目標内容
  days: number; // 0〜14日のカウント
  isLevelUp: boolean; // このフレームでレベルアップするか
  isLevelDown: boolean; // このフレームでレベルダウンするか
}

/**
 * 1日分のアニメーションフレーム
 */
export interface AnimationFrame {
  date: string; // YYYY-MM-DD
  bronze: LevelFrameState;
  silver: LevelFrameState;
  gold: LevelFrameState;
}

/**
 * アニメーション再生の状態
 */
export interface AnimationState {
  isPlaying: boolean;
  currentFrameIndex: number;
  totalFrames: number;
  frames: AnimationFrame[];
}
