'use client';

// レベルアップ・レベルダウンのエフェクト表示

import { useEffect, useState } from 'react';

interface LevelUpEffectProps {
  type: 'level_up' | 'level_down' | null;
  onComplete?: () => void;
}

export function LevelUpEffect({ type, onComplete }: LevelUpEffectProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setIsVisible(true);

      // 1.5秒後に非表示にする
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [type, onComplete]);

  if (!isVisible || !type) {
    return null;
  }

  const isLevelUp = type === 'level_up';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/20 animate-fade-in" />

      {/* エフェクト本体 */}
      <div
        className={`
          relative text-6xl font-bold animate-bounce-in
          ${isLevelUp ? 'text-green-500' : 'text-orange-500'}
          drop-shadow-2xl
        `}
      >
        {isLevelUp ? (
          <>
            <div className="relative">
              LEVEL UP!
              {/* 光のエフェクト */}
              <div className="absolute inset-0 animate-ping text-green-300 opacity-50">
                LEVEL UP!
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              ADJUST!
              {/* 光のエフェクト */}
              <div className="absolute inset-0 animate-pulse text-orange-300 opacity-50">
                ADJUST!
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
