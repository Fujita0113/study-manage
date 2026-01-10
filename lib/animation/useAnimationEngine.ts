// アニメーション再生エンジン（React Hook）

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimationFrame, AnimationState } from './types';

interface UseAnimationEngineOptions {
  frames: AnimationFrame[];
  frameInterval?: number; // ミリ秒単位（デフォルト: 200ms = 1日あたり0.2秒）
  onComplete?: () => void;
}

export function useAnimationEngine({
  frames,
  frameInterval = 200,
  onComplete,
}: UseAnimationEngineOptions) {
  const [state, setState] = useState<AnimationState>({
    isPlaying: false,
    currentFrameIndex: Math.max(0, frames.length - 1), // 初期表示は最終フレーム
    totalFrames: frames.length,
    frames,
  });

  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  /**
   * アニメーションを開始
   */
  const play = useCallback(() => {
    setState(prev => {
      // 現在最終フレームにいる場合は、最初からアニメーションを開始
      if (prev.currentFrameIndex === prev.totalFrames - 1) {
        return {
          ...prev,
          isPlaying: true,
          currentFrameIndex: 0,
        };
      }
      // 途中で止めた場合は続きから再生
      return { ...prev, isPlaying: true };
    });
    lastFrameTimeRef.current = Date.now();
  }, []);

  /**
   * アニメーションを一時停止
   */
  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  /**
   * アニメーションをリセット（最終フレームに戻る）
   */
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentFrameIndex: Math.max(0, prev.totalFrames - 1), // 最終フレームに戻る
    }));
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  /**
   * 特定のフレームにジャンプ
   */
  const jumpToFrame = useCallback((frameIndex: number) => {
    setState(prev => ({
      ...prev,
      currentFrameIndex: Math.max(0, Math.min(frameIndex, frames.length - 1)),
    }));
  }, [frames.length]);

  /**
   * アニメーションループ
   */
  useEffect(() => {
    if (!state.isPlaying) return;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        setState(prev => {
          const nextIndex = prev.currentFrameIndex + 1;

          if (nextIndex >= prev.totalFrames) {
            // アニメーション完了
            if (onComplete) {
              onComplete();
            }
            return {
              ...prev,
              isPlaying: false,
              currentFrameIndex: prev.totalFrames - 1, // 最後のフレームで停止
            };
          }

          return {
            ...prev,
            currentFrameIndex: nextIndex,
          };
        });

        lastFrameTimeRef.current = now;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, frameInterval, onComplete, state.totalFrames]);

  /**
   * フレームが変更されたら状態を更新（最終フレームを表示）
   */
  useEffect(() => {
    setState(prev => ({
      ...prev,
      frames,
      totalFrames: frames.length,
      currentFrameIndex: Math.max(0, frames.length - 1), // 最終フレームに移動
    }));
  }, [frames]);

  return {
    state,
    currentFrame: state.frames[state.currentFrameIndex] || null,
    play,
    pause,
    reset,
    jumpToFrame,
  };
}
