'use client';

// 目標変遷画面（Goal Progress Race）

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LevelDisplay } from '@/components/progress-race/LevelDisplay';
import { RaceBarChart } from '@/components/progress-race/RaceBarChart';
import { PlaybackControls } from '@/components/progress-race/PlaybackControls';
import { LevelHistoryModal } from '@/components/progress-race/LevelHistoryModal';
import { useAppState } from '@/lib/store';
import { generateAnimationFrames } from '@/lib/animation/generateFrames';
import { useAnimationEngine } from '@/lib/animation/useAnimationEngine';
import { mockDailyRecords } from '@/lib/mockData';
import { GoalLevel } from '@/types';

export default function HistoryPage() {
  const { getGoalHistory } = useAppState();
  const goalHistory = getGoalHistory();

  // アニメーションフレームを生成
  const frames = useMemo(() => {
    return generateAnimationFrames(goalHistory, mockDailyRecords);
  }, [goalHistory]);

  // アニメーションエンジン
  const { state, currentFrame, play, pause, reset } = useAnimationEngine({
    frames,
    frameInterval: 200, // 200ms per frame
  });

  // モーダル状態
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    level: GoalLevel | null;
  }>({
    isOpen: false,
    level: null,
  });

  // バークリック時の処理
  const handleBarClick = (level: GoalLevel) => {
    setModalState({ isOpen: true, level });
  };

  // モーダルを閉じる
  const closeModal = () => {
    setModalState({ isOpen: false, level: null });
  };

  // 現在のレベルを取得
  const currentLevels = useMemo(() => {
    if (!currentFrame) {
      return { bronze: 0, silver: 0, gold: 0 };
    }
    return {
      bronze: currentFrame.bronze.levelNumber,
      silver: currentFrame.silver.levelNumber,
      gold: currentFrame.gold.levelNumber,
    };
  }, [currentFrame]);

  return (
    <AppLayout pageTitle="目標変遷">
      <div className="pb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          目標変遷 - デッドヒート
        </h1>
        <p className="text-slate-600 mb-6">
          各目標レベル（Bronze/Silver/Gold）の成長プロセスをアニメーションで確認できます。
        </p>

        {/* 現在のレベル表示 */}
        <LevelDisplay
          bronzeLevel={currentLevels.bronze}
          silverLevel={currentLevels.silver}
          goldLevel={currentLevels.gold}
        />

        {/* デッドヒート表示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <RaceBarChart
            currentFrame={currentFrame}
            onBarClick={handleBarClick}
          />
        </div>

        {/* 再生コントロール */}
        <PlaybackControls
          isPlaying={state.isPlaying}
          onPlay={play}
          onPause={pause}
          onReset={reset}
        />

        {/* 進捗表示 */}
        <div className="text-center mt-4 text-sm text-slate-500">
          {state.currentFrameIndex + 1} / {state.totalFrames} フレーム
          {currentFrame && (
            <span className="ml-2">({currentFrame.date})</span>
          )}
        </div>

        {/* レベル履歴モーダル */}
        <LevelHistoryModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          level={modalState.level}
          goalCards={
            modalState.level
              ? goalHistory[modalState.level]
              : []
          }
          dailyRecords={mockDailyRecords}
        />
      </div>
    </AppLayout>
  );
}
