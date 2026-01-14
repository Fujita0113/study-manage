// アプリケーションの状態管理（Mock Data Provider）

'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { GoalHistory } from '@/types';
import { mockGoalHistory } from './mockData';

interface AppStateContextType {
  getGoalHistory: () => GoalHistory;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // 目標変遷履歴を取得
  const getGoalHistory = (): GoalHistory => {
    return mockGoalHistory;
  };

  return (
    <AppStateContext.Provider
      value={{
        getGoalHistory,
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

