import {
  UserSettings,
  Goal,
  Effort,
  DailyRecord,
  EffortEvaluation,
  Streak,
  GitHubCommit,
  GoalLevel,
  AchievementLevel,
  EffortStatus,
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
  githubUsername: 'fujita-dev',
  githubRepo: 'fujita-dev/study-project',
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

// Mock Efforts (工夫)
export const mockEfforts: Effort[] = [
  // Bronze Level Efforts (Active)
  {
    id: 'effort-bronze-1',
    userId: MOCK_USER_ID,
    goalLevel: 'bronze',
    title: 'ジャージで寝る',
    description: '起きてすぐデスクに座れるように、寝る時からジャージを着ておく',
    status: 'active',
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-05'),
    activatedAt: new Date('2025-01-05'),
  },
  {
    id: 'effort-bronze-2',
    userId: MOCK_USER_ID,
    goalLevel: 'bronze',
    title: 'PCを開いたままにする',
    description: '前日の夜、PCを閉じずにスリープ状態で置いておく',
    status: 'active',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
    activatedAt: new Date('2025-01-10'),
  },
  // Bronze Level Efforts (Archived)
  {
    id: 'effort-bronze-archived-1',
    userId: MOCK_USER_ID,
    goalLevel: 'bronze',
    title: 'アラームを10個セットする',
    description: '朝起きられるように、5分間隔でアラームを設定',
    status: 'archived',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-08'),
    activatedAt: new Date('2025-01-02'),
  },
  // Silver Level Efforts (Active)
  {
    id: 'effort-silver-1',
    userId: MOCK_USER_ID,
    goalLevel: 'silver',
    title: '昼休みにTODOリストを作る',
    description: '午後の作業前に、具体的なタスクリストを作成する',
    status: 'active',
    createdAt: new Date('2025-01-07'),
    updatedAt: new Date('2025-01-07'),
    activatedAt: new Date('2025-01-07'),
  },
  {
    id: 'effort-silver-2',
    userId: MOCK_USER_ID,
    goalLevel: 'silver',
    title: 'ポモドーロタイマーを使う',
    description: '25分作業 + 5分休憩のサイクルで集中力を維持',
    status: 'active',
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-12'),
    activatedAt: new Date('2025-01-12'),
  },
  // Gold Level Efforts (Active)
  {
    id: 'effort-gold-1',
    userId: MOCK_USER_ID,
    goalLevel: 'gold',
    title: '15分の昼寝を取る',
    description: '午後の眠気対策として、昼食後に15分だけ仮眠を取る',
    status: 'active',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    activatedAt: new Date('2025-01-15'),
  },
];

// Mock Daily Records (過去7日分 + 今日)
export const mockDailyRecords: DailyRecord[] = [
  // 7日前: Gold達成
  {
    id: 'record-7days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(7),
    achievementLevel: 'gold',
    journalText: 'リファクタリングまで完璧にできた。集中力が続いた。',
    createdAt: new Date(getDateString(7)),
    updatedAt: new Date(getDateString(7)),
  },
  // 6日前: Gold達成
  {
    id: 'record-6days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(6),
    achievementLevel: 'gold',
    journalText: '今日も調子が良かった。ペースを維持できている。',
    createdAt: new Date(getDateString(6)),
    updatedAt: new Date(getDateString(6)),
  },
  // 5日前: Silver達成
  {
    id: 'record-5days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(5),
    achievementLevel: 'silver',
    journalText: '1機能は完成したけど、リファクタまでは時間が足りなかった。',
    stepUpStrategy: '午後の睡魔対策が必要。15分の昼寝を導入する。',
    createdAt: new Date(getDateString(5)),
    updatedAt: new Date(getDateString(5)),
  },
  // 4日前: Gold達成
  {
    id: 'record-4days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(4),
    achievementLevel: 'gold',
    journalText: '昼寝の効果が出た。午後もパフォーマンスを維持できた。',
    createdAt: new Date(getDateString(4)),
    updatedAt: new Date(getDateString(4)),
  },
  // 3日前: Gold達成
  {
    id: 'record-3days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(3),
    achievementLevel: 'gold',
    journalText: '完全に流れに乗れている。このペースを維持したい。',
    createdAt: new Date(getDateString(3)),
    updatedAt: new Date(getDateString(3)),
  },
  // 2日前: Silver達成
  {
    id: 'record-2days-ago',
    userId: MOCK_USER_ID,
    date: getDateString(2),
    achievementLevel: 'silver',
    journalText: '少し疲れが出てきた。でも最低限の目標は達成。',
    createdAt: new Date(getDateString(2)),
    updatedAt: new Date(getDateString(2)),
  },
  // 1日前 (昨日): Bronze達成
  {
    id: 'record-yesterday',
    userId: MOCK_USER_ID,
    date: getDateString(1),
    achievementLevel: 'bronze',
    journalText: '今日は30分だけ。でも続けることが大事。',
    stepUpStrategy: 'ポモドーロタイマーを使って、集中力を維持する工夫を試す。',
    createdAt: new Date(getDateString(1)),
    updatedAt: new Date(getDateString(1)),
  },
];

// Mock Effort Evaluations (昨日の評価)
export const mockEffortEvaluations: EffortEvaluation[] = [
  {
    id: 'eval-yesterday-1',
    dailyRecordId: 'record-yesterday',
    effortId: 'effort-bronze-1',
    executed: 'yes',
    effectiveness: 'excellent',
    nextAction: 'continue',
    createdAt: new Date(getDateString(1)),
    updatedAt: new Date(getDateString(1)),
  },
  {
    id: 'eval-yesterday-2',
    dailyRecordId: 'record-yesterday',
    effortId: 'effort-bronze-2',
    executed: 'yes',
    effectiveness: 'moderate',
    nextAction: 'continue',
    createdAt: new Date(getDateString(1)),
    updatedAt: new Date(getDateString(1)),
  },
  {
    id: 'eval-yesterday-3',
    dailyRecordId: 'record-yesterday',
    effortId: 'effort-silver-1',
    executed: 'no',
    effectiveness: 'not_evaluated',
    nextAction: 'continue',
    createdAt: new Date(getDateString(1)),
    updatedAt: new Date(getDateString(1)),
  },
];

// Mock Streak
export const mockStreak: Streak = {
  id: 'streak-001',
  userId: MOCK_USER_ID,
  currentStreak: 7,
  longestStreak: 12,
  lastRecordedDate: getDateString(1),
  updatedAt: new Date(),
};

// Mock GitHub Commits (過去7日分に分散)
export const mockGitHubCommits: GitHubCommit[] = [
  // 今日のコミット
  {
    sha: 'commit-today-1',
    message: 'feat: ホーム画面のデイリーレポートカード実装',
    author: 'fujita-dev',
    date: new Date(getDateString(0)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-today-1',
  },
  {
    sha: 'commit-today-2',
    message: 'fix: カードのレスポンシブ対応を修正',
    author: 'fujita-dev',
    date: new Date(getDateString(0)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-today-2',
  },
  // 1日前
  {
    sha: 'commit-1day-1',
    message: 'feat: 日報入力フォームのバリデーション追加',
    author: 'fujita-dev',
    date: new Date(getDateString(1)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-1day-1',
  },
  // 2日前
  {
    sha: 'commit-2days-1',
    message: 'feat: カレンダー画面のUI改善',
    author: 'fujita-dev',
    date: new Date(getDateString(2)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-2days-1',
  },
  {
    sha: 'commit-2days-2',
    message: 'refactor: 共通コンポーネントの整理',
    author: 'fujita-dev',
    date: new Date(getDateString(2)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-2days-2',
  },
  {
    sha: 'commit-2days-3',
    message: 'test: カレンダー機能のテスト追加',
    author: 'fujita-dev',
    date: new Date(getDateString(2)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-2days-3',
  },
  // 3日前
  {
    sha: 'commit-3days-1',
    message: 'feat: 工夫管理画面の実装完了',
    author: 'fujita-dev',
    date: new Date(getDateString(3)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-3days-1',
  },
  {
    sha: 'commit-3days-2',
    message: 'fix: 工夫評価のロジック修正',
    author: 'fujita-dev',
    date: new Date(getDateString(3)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-3days-2',
  },
  // 4日前
  {
    sha: 'commit-4days-1',
    message: 'feat: 目標設定画面の実装',
    author: 'fujita-dev',
    date: new Date(getDateString(4)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-4days-1',
  },
  {
    sha: 'commit-4days-2',
    message: 'refactor: 目標レベルのバリデーション改善',
    author: 'fujita-dev',
    date: new Date(getDateString(4)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-4days-2',
  },
  {
    sha: 'commit-4days-3',
    message: 'docs: README更新',
    author: 'fujita-dev',
    date: new Date(getDateString(4)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-4days-3',
  },
  // 5日前
  {
    sha: 'commit-5days-1',
    message: 'feat: データベーススキーマの設計',
    author: 'fujita-dev',
    date: new Date(getDateString(5)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-5days-1',
  },
  {
    sha: 'commit-5days-2',
    message: 'feat: Prismaセットアップ完了',
    author: 'fujita-dev',
    date: new Date(getDateString(5)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-5days-2',
  },
  // 6日前
  {
    sha: 'commit-6days-1',
    message: 'feat: Next.jsプロジェクト初期セットアップ',
    author: 'fujita-dev',
    date: new Date(getDateString(6)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-6days-1',
  },
  {
    sha: 'commit-6days-2',
    message: 'feat: TailwindCSS導入',
    author: 'fujita-dev',
    date: new Date(getDateString(6)).toISOString(),
    url: 'https://github.com/fujita-dev/study-project/commit/commit-6days-2',
  },
];

// Export all mock data
export const mockData = {
  userSettings: mockUserSettings,
  goals: mockGoals,
  efforts: mockEfforts,
  dailyRecords: mockDailyRecords,
  effortEvaluations: mockEffortEvaluations,
  streak: mockStreak,
  githubCommits: mockGitHubCommits,
};
