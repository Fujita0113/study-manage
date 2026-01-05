// アプリケーションの状態管理（Mock Data Provider）

'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Streak } from '@/types';
import { mockData } from './mockData';

interface AppStateContextType {
  getStreakDays: () => number;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // 連続達成日数を取得
  const getStreakDays = (): number => {
    return mockData.streak.currentStreak;
  };

  return (
    <AppStateContext.Provider
      value={{
        getStreakDays,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

