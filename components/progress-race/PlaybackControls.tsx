'use client';

// 再生コントロールボタン

import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
}: PlaybackControlsProps) {
  return (
    <div className="flex justify-center gap-4 mt-8">
      {/* 再生/一時停止ボタン */}
      {!isPlaying ? (
        <button
          onClick={onPlay}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          aria-label="再生"
        >
          <PlayIcon className="w-5 h-5" />
          <span className="font-medium">再生</span>
        </button>
      ) : (
        <button
          onClick={onPause}
          className="flex items-center gap-2 px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors shadow-md"
          aria-label="一時停止"
        >
          <PauseIcon className="w-5 h-5" />
          <span className="font-medium">一時停止</span>
        </button>
      )}

      {/* リセットボタン */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        aria-label="リセット"
      >
        <ArrowPathIcon className="w-5 h-5" />
        <span className="font-medium">リセット</span>
      </button>
    </div>
  );
}
