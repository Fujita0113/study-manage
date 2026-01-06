import {
  UserSettings,
  Goal,
  DailyRecord,
  Streak,
  AchievementLevel,
  GoalHistorySlot,
  GoalHistory,
  GoalCard,
} from '@/types';

// Helper function to get date string in YYYY-MM-DD format
function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Mock User ID
export const MOCK_USER_ID = 'mock-user-001';

// Mock User Settings
export const mockUserSettings: UserSettings = {
  id: MOCK_USER_ID,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date(),
};

// Mock Goals (Bronze, Silver, Gold)
export const mockGoals: Goal[] = [
  {
    id: 'goal-bronze',
    userId: MOCK_USER_ID,
    level: 'bronze',
    description: '30分だけプログラミングする',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'goal-silver',
    userId: MOCK_USER_ID,
    level: 'silver',
    description: '1つの機能を完成させる',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'goal-gold',
    userId: MOCK_USER_ID,
    level: 'gold',
    description: 'リファクタリングまで完了させる',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

// Mock Daily Records (過去14日分、Bronze連続達成で提案テスト用)
// 今日(0日前)は未記録、14日前～1日前までBronze連続達成
export const mockDailyRecords: DailyRecord[] = [
  // 14日前: Bronze達成
  {
    id: 'record-14days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(14),
    achievementLevel: 'bronze',
    doText: 'Next.jsの基礎を30分学習\nTypeScriptの型定義を復習',
    journalText: '30分だけだったけど、続けることが大事。',
    createdAt: new Date(getDateString(14)),
    updatedAt: new Date(getDateString(14)),
  },
  // 13日前: Bronze達成
  {
    id: 'record-13days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(13),
    achievementLevel: 'bronze',
    doText: 'Reactのコンポーネント設計を学習',
    journalText: '少しずつ理解が深まってきた。',
    createdAt: new Date(getDateString(13)),
    updatedAt: new Date(getDateString(13)),
  },
  // 12日前: Bronze達成
  {
    id: 'record-12days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(12),
    achievementLevel: 'bronze',
    doText: 'CSSの基礎復習',
    journalText: 'Flexboxが少し分かってきた。',
    createdAt: new Date(getDateString(12)),
    updatedAt: new Date(getDateString(12)),
  },
  // 11日前: Bronze達成
  {
    id: 'record-11days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(11),
    achievementLevel: 'bronze',
    doText: 'JavaScriptの非同期処理を学習',
    journalText: 'async/awaitの使い方が分かった。',
    createdAt: new Date(getDateString(11)),
    updatedAt: new Date(getDateString(11)),
  },
  // 10日前: Bronze達成
  {
    id: 'record-10days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(10),
    achievementLevel: 'bronze',
    doText: 'データベースの基礎を学習',
    journalText: 'SQLの基本が理解できた。',
    createdAt: new Date(getDateString(10)),
    updatedAt: new Date(getDateString(10)),
  },
  // 9日前: Bronze達成
  {
    id: 'record-9days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(9),
    achievementLevel: 'bronze',
    doText: 'APIの設計について学習',
    journalText: 'RESTfulな設計の重要性が分かった。',
    createdAt: new Date(getDateString(9)),
    updatedAt: new Date(getDateString(9)),
  },
  // 8日前: Bronze達成
  {
    id: 'record-8days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(8),
    achievementLevel: 'bronze',
    doText: 'Git/GitHubの使い方を復習',
    journalText: 'ブランチの使い方が理解できた。',
    createdAt: new Date(getDateString(8)),
    updatedAt: new Date(getDateString(8)),
  },
  // 7日前: Bronze達成
  {
    id: 'record-7days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(7),
    achievementLevel: 'bronze',
    doText: 'コードレビューの観点を学習',
    journalText: '他人のコードを読む練習になった。',
    createdAt: new Date(getDateString(7)),
    updatedAt: new Date(getDateString(7)),
  },
  // 6日前: Bronze達成
  {
    id: 'record-6days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(6),
    achievementLevel: 'bronze',
    doText: 'テストコードの書き方を学習',
    journalText: 'Jestの基本的な使い方が分かった。',
    createdAt: new Date(getDateString(6)),
    updatedAt: new Date(getDateString(6)),
  },
  // 5日前: Bronze達成
  {
    id: 'record-5days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(5),
    achievementLevel: 'bronze',
    doText: 'パフォーマンス最適化について学習',
    journalText: '遅延読み込みの重要性が理解できた。',
    createdAt: new Date(getDateString(5)),
    updatedAt: new Date(getDateString(5)),
  },
  // 4日前: Bronze達成
  {
    id: 'record-4days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(4),
    achievementLevel: 'bronze',
    doText: 'セキュリティの基礎を学習',
    journalText: 'XSS対策の重要性が分かった。',
    createdAt: new Date(getDateString(4)),
    updatedAt: new Date(getDateString(4)),
  },
  // 3日前: Bronze達成
  {
    id: 'record-3days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(3),
    achievementLevel: 'bronze',
    doText: 'アクセシビリティについて学習',
    journalText: 'WAI-ARIAの基本が理解できた。',
    createdAt: new Date(getDateString(3)),
    updatedAt: new Date(getDateString(3)),
  },
  // 2日前: Bronze達成
  {
    id: 'record-2days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(2),
    achievementLevel: 'bronze',
    doText: 'デプロイ方法について学習',
    journalText: 'Vercelの使い方が分かった。',
    createdAt: new Date(getDateString(2)),
    updatedAt: new Date(getDateString(2)),
  },
  // 1日前: Bronze達成（14日連続達成を完成させる）
  {
    id: 'record-1day-ago',
    userId: MOCK_USER_ID,
    date: getDateString(1),
    achievementLevel: 'bronze',
    doText: 'モニタリング・ログ管理について学習',
    journalText: '14日連続達成！少しずつ成長している。',
    createdAt: new Date(getDateString(1)),
    updatedAt: new Date(getDateString(1)),
  },
];

// Mock Streak
export const mockStreak: Streak = {
  id: 'streak-001',
  userId: MOCK_USER_ID,
  currentStreak: 14, // 14日連続達成中
  longestStreak: 14,
  lastRecordedDate: getDateString(1), // 昨日が最後の記録
  updatedAt: new Date(),
};

// Mock Goal History Slots
export const mockGoalHistorySlots: GoalHistorySlot[] = [
  {
    id: 'slot-1',
    userId: MOCK_USER_ID,
    bronzeGoal: '毎日30分プログラミングする',
    silverGoal: '1つの機能を完成させる',
    goldGoal: 'リファクタリングまで完了させる',
    startDate: '2026-01-01',
    endDate: '2026-01-14',
    changeReason: 'initial',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'slot-2',
    userId: MOCK_USER_ID,
    bronzeGoal: '毎日1時間プログラミングする',
    silverGoal: '2つの機能を完成させる',
    goldGoal: 'テストコードも書く',
    startDate: '2026-01-15',
    endDate: undefined, // 現在進行中
    changeReason: 'bronze_14days',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
];

// Mock Goal History - New UI Design (独立したカード表示用)
// レベルアップ・ダウンの両方のパターンを含む充実したモックデータ
export const mockGoalHistory: GoalHistory = {
  bronze: [
    // 期間1: 初回設定 (2025/11/01 - 2025/11/14, 14日間)
    {
      id: 'bronze-card-1',
      level: 'bronze',
      content: '机に座る',
      startDate: '2025-11-01',
      endDate: '2025-11-14',
      transitionType: 'level_up', // 14日連続達成でレベルアップ
    },
    // 期間2: レベルアップ (2025/11/15 - 2025/12/05, 21日間)
    {
      id: 'bronze-card-2',
      level: 'bronze',
      content: '30分集中する',
      startDate: '2025-11-15',
      endDate: '2025-12-05',
      transitionType: 'level_down', // 7日中4日未達でレベルダウン
    },
    // 期間3: レベルダウン (2025/12/06 - 2025/12/19, 14日間)
    {
      id: 'bronze-card-3',
      level: 'bronze',
      content: '机に座る（調整後）',
      startDate: '2025-12-06',
      endDate: '2025-12-19',
      transitionType: 'level_up', // 再度14日連続達成
    },
    // 期間4: 現在進行中 (2025/12/20 - null)
    {
      id: 'bronze-card-4',
      level: 'bronze',
      content: '30分集中する（再挑戦）',
      startDate: '2025-12-20',
      endDate: null,
      transitionType: null,
      currentStreak: 7, // 現在7日連続達成中
    },
  ],
  silver: [
    // 期間1: 初回設定 (2025/11/01 - 2025/11/21, 21日間)
    {
      id: 'silver-card-1',
      level: 'silver',
      content: '1機能完成させる',
      startDate: '2025-11-01',
      endDate: '2025-11-21',
      transitionType: null, // 変更なし（継続）
    },
    // 期間2: 継続 (2025/11/22 - 2025/12/12, 21日間)
    {
      id: 'silver-card-2',
      level: 'silver',
      content: '1機能完成させる',
      startDate: '2025-11-22',
      endDate: '2025-12-12',
      transitionType: 'level_up', // 14日連続達成でレベルアップ
    },
    // 期間3: レベルアップ (2025/12/13 - null)
    {
      id: 'silver-card-3',
      level: 'silver',
      content: '2機能完成させる',
      startDate: '2025-12-13',
      endDate: null,
      transitionType: null,
      currentStreak: 10, // 現在10日連続達成中
    },
  ],
  gold: [
    // 期間1: 初回設定 (2025/11/01 - 2025/11/28, 28日間)
    {
      id: 'gold-card-1',
      level: 'gold',
      content: 'リファクタまで完了',
      startDate: '2025-11-01',
      endDate: '2025-11-28',
      transitionType: 'level_up', // 14日連続達成でレベルアップ
    },
    // 期間2: レベルアップ (2025/11/29 - 2025/12/15, 17日間)
    {
      id: 'gold-card-2',
      level: 'gold',
      content: 'テストコードも書く',
      startDate: '2025-11-29',
      endDate: '2025-12-15',
      transitionType: 'level_up', // さらにレベルアップ
    },
    // 期間3: さらにレベルアップ (2025/12/16 - null)
    {
      id: 'gold-card-3',
      level: 'gold',
      content: 'ドキュメントも整備する',
      startDate: '2025-12-16',
      endDate: null,
      transitionType: null,
      currentStreak: 5, // 現在5日連続達成中
    },
  ],
};
