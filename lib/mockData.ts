import {
  UserSettings,
  Goal,
  DailyRecord,
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

// Mock User ID (Supabaseで使用しているUUID)
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

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

// Mock Daily Records - 2025/11/01 から現在までの全期間をカバー
// 各レベルの遷移条件を満たすように設計されたデータ
export const mockDailyRecords: DailyRecord[] = [
  // ========================================
  // Bronze Lv.1 期間: 2025/11/01 - 2025/11/14 (14日連続達成でレベルアップ)
  // Silver Lv.1 期間: 2025/11/01 - 2025/11/21 (一部達成)
  // Gold Lv.1 期間: 2025/11/01 - 2025/11/28 (一部達成)
  // ========================================
  { id: 'record-2025-11-01', userId: MOCK_USER_ID, date: '2025-11-01', achievementLevel: 'gold', doText: 'プロジェクト初日\nリファクタリングまで完了', journalText: '最高のスタートを切れた！', createdAt: new Date('2025-11-01'), updatedAt: new Date('2025-11-01') },
  { id: 'record-2025-11-02', userId: MOCK_USER_ID, date: '2025-11-02', achievementLevel: 'silver', doText: '機能1を完成させた', journalText: '順調に進んでいる', createdAt: new Date('2025-11-02'), updatedAt: new Date('2025-11-02') },
  { id: 'record-2025-11-03', userId: MOCK_USER_ID, date: '2025-11-03', achievementLevel: 'gold', doText: '機能2を実装\nテストコードも追加', journalText: 'テストまで書けて満足', createdAt: new Date('2025-11-03'), updatedAt: new Date('2025-11-03') },
  { id: 'record-2025-11-04', userId: MOCK_USER_ID, date: '2025-11-04', achievementLevel: 'bronze', doText: '机に座って30分学習', journalText: '今日はこれで十分', createdAt: new Date('2025-11-04'), updatedAt: new Date('2025-11-04') },
  { id: 'record-2025-11-05', userId: MOCK_USER_ID, date: '2025-11-05', achievementLevel: 'gold', doText: 'バグ修正とリファクタ完了', journalText: 'コードがきれいになった', createdAt: new Date('2025-11-05'), updatedAt: new Date('2025-11-05') },
  { id: 'record-2025-11-06', userId: MOCK_USER_ID, date: '2025-11-06', achievementLevel: 'silver', doText: '認証機能を実装', journalText: '計画通りに進んだ', createdAt: new Date('2025-11-06'), updatedAt: new Date('2025-11-06') },
  { id: 'record-2025-11-07', userId: MOCK_USER_ID, date: '2025-11-07', achievementLevel: 'bronze', doText: 'ドキュメント整理', journalText: '最低限の作業', createdAt: new Date('2025-11-07'), updatedAt: new Date('2025-11-07') },
  { id: 'record-2025-11-08', userId: MOCK_USER_ID, date: '2025-11-08', achievementLevel: 'gold', doText: 'UI改善とテスト追加', journalText: '期待以上の成果', createdAt: new Date('2025-11-08'), updatedAt: new Date('2025-11-08') },
  { id: 'record-2025-11-09', userId: MOCK_USER_ID, date: '2025-11-09', achievementLevel: 'silver', doText: 'データベース設計を完成', journalText: '1機能完成', createdAt: new Date('2025-11-09'), updatedAt: new Date('2025-11-09') },
  { id: 'record-2025-11-10', userId: MOCK_USER_ID, date: '2025-11-10', achievementLevel: 'gold', doText: 'API実装とドキュメント作成', journalText: '完璧な仕上がり', createdAt: new Date('2025-11-10'), updatedAt: new Date('2025-11-10') },
  { id: 'record-2025-11-11', userId: MOCK_USER_ID, date: '2025-11-11', achievementLevel: 'bronze', doText: 'コードレビュー対応', journalText: '最低限対応した', createdAt: new Date('2025-11-11'), updatedAt: new Date('2025-11-11') },
  { id: 'record-2025-11-12', userId: MOCK_USER_ID, date: '2025-11-12', achievementLevel: 'gold', doText: 'パフォーマンス改善完了', journalText: '大幅に高速化できた', createdAt: new Date('2025-11-12'), updatedAt: new Date('2025-11-12') },
  { id: 'record-2025-11-13', userId: MOCK_USER_ID, date: '2025-11-13', achievementLevel: 'silver', doText: 'エラーハンドリング追加', journalText: '堅牢性が上がった', createdAt: new Date('2025-11-13'), updatedAt: new Date('2025-11-13') },
  { id: 'record-2025-11-14', userId: MOCK_USER_ID, date: '2025-11-14', achievementLevel: 'gold', doText: 'リファクタリング完了', journalText: 'Bronze 14日連続達成！', createdAt: new Date('2025-11-14'), updatedAt: new Date('2025-11-14') },

  // ========================================
  // Bronze Lv.2 期間: 2025/11/15 - 2025/12/05 (7日中4日未達でレベルダウン)
  // Silver Lv.1 期間: 2025/11/01 - 2025/11/21 (継続)
  // Gold Lv.1 期間: 2025/11/01 - 2025/11/28 (継続)
  // ========================================
  { id: 'record-2025-11-15', userId: MOCK_USER_ID, date: '2025-11-15', achievementLevel: 'gold', doText: '30分集中してコーディング\nリファクタまで完了', journalText: 'Lv.2スタート！調子良い', createdAt: new Date('2025-11-15'), updatedAt: new Date('2025-11-15') },
  { id: 'record-2025-11-16', userId: MOCK_USER_ID, date: '2025-11-16', achievementLevel: 'silver', doText: '30分集中\n機能実装完了', journalText: '集中できた', createdAt: new Date('2025-11-16'), updatedAt: new Date('2025-11-16') },
  { id: 'record-2025-11-17', userId: MOCK_USER_ID, date: '2025-11-17', achievementLevel: 'bronze', doText: '30分だけ頑張った', journalText: '最低限達成', createdAt: new Date('2025-11-17'), updatedAt: new Date('2025-11-17') },
  { id: 'record-2025-11-18', userId: MOCK_USER_ID, date: '2025-11-18', achievementLevel: 'none', doText: 'なし', journalText: '今日は無理だった', createdAt: new Date('2025-11-18'), updatedAt: new Date('2025-11-18') },
  { id: 'record-2025-11-19', userId: MOCK_USER_ID, date: '2025-11-19', achievementLevel: 'gold', doText: '集中して開発\nリファクタまで完了', journalText: '復活！', createdAt: new Date('2025-11-19'), updatedAt: new Date('2025-11-19') },
  { id: 'record-2025-11-20', userId: MOCK_USER_ID, date: '2025-11-20', achievementLevel: 'silver', doText: '機能実装', journalText: '順調', createdAt: new Date('2025-11-20'), updatedAt: new Date('2025-11-20') },
  { id: 'record-2025-11-21', userId: MOCK_USER_ID, date: '2025-11-21', achievementLevel: 'gold', doText: 'テストコード追加', journalText: 'Silver 14日達成（11/8-11/21）！', createdAt: new Date('2025-11-21'), updatedAt: new Date('2025-11-21') },

  // Silver Lv.1 継続期間: 2025/11/22 - 2025/12/12
  { id: 'record-2025-11-22', userId: MOCK_USER_ID, date: '2025-11-22', achievementLevel: 'bronze', doText: '30分学習', journalText: '継続中', createdAt: new Date('2025-11-22'), updatedAt: new Date('2025-11-22') },
  { id: 'record-2025-11-23', userId: MOCK_USER_ID, date: '2025-11-23', achievementLevel: 'none', doText: 'なし', journalText: '休息', createdAt: new Date('2025-11-23'), updatedAt: new Date('2025-11-23') },
  { id: 'record-2025-11-24', userId: MOCK_USER_ID, date: '2025-11-24', achievementLevel: 'silver', doText: '機能追加', journalText: '順調', createdAt: new Date('2025-11-24'), updatedAt: new Date('2025-11-24') },
  { id: 'record-2025-11-25', userId: MOCK_USER_ID, date: '2025-11-25', achievementLevel: 'gold', doText: 'リファクタリング完了', journalText: '完璧', createdAt: new Date('2025-11-25'), updatedAt: new Date('2025-11-25') },
  { id: 'record-2025-11-26', userId: MOCK_USER_ID, date: '2025-11-26', achievementLevel: 'bronze', doText: '30分作業', journalText: '最低限', createdAt: new Date('2025-11-26'), updatedAt: new Date('2025-11-26') },
  { id: 'record-2025-11-27', userId: MOCK_USER_ID, date: '2025-11-27', achievementLevel: 'none', doText: 'なし', journalText: '今日は休み', createdAt: new Date('2025-11-27'), updatedAt: new Date('2025-11-27') },
  { id: 'record-2025-11-28', userId: MOCK_USER_ID, date: '2025-11-28', achievementLevel: 'gold', doText: 'ドキュメント整備完了', journalText: 'Gold 14日達成（11/15-11/28）！', createdAt: new Date('2025-11-28'), updatedAt: new Date('2025-11-28') },

  // Gold Lv.2 期間: 2025/11/29 - 2025/12/15
  { id: 'record-2025-11-29', userId: MOCK_USER_ID, date: '2025-11-29', achievementLevel: 'gold', doText: 'テストコード追加', journalText: 'Gold Lv.2スタート！', createdAt: new Date('2025-11-29'), updatedAt: new Date('2025-11-29') },
  { id: 'record-2025-11-30', userId: MOCK_USER_ID, date: '2025-11-30', achievementLevel: 'silver', doText: '機能実装', journalText: '順調', createdAt: new Date('2025-11-30'), updatedAt: new Date('2025-11-30') },
  { id: 'record-2025-12-01', userId: MOCK_USER_ID, date: '2025-12-01', achievementLevel: 'none', doText: 'なし', journalText: '休息日', createdAt: new Date('2025-12-01'), updatedAt: new Date('2025-12-01') },
  { id: 'record-2025-12-02', userId: MOCK_USER_ID, date: '2025-12-02', achievementLevel: 'gold', doText: 'テストコード実装', journalText: '調子良い', createdAt: new Date('2025-12-02'), updatedAt: new Date('2025-12-02') },
  { id: 'record-2025-12-03', userId: MOCK_USER_ID, date: '2025-12-03', achievementLevel: 'silver', doText: '機能追加', journalText: '継続', createdAt: new Date('2025-12-03'), updatedAt: new Date('2025-12-03') },
  { id: 'record-2025-12-04', userId: MOCK_USER_ID, date: '2025-12-04', achievementLevel: 'none', doText: 'なし', journalText: '休み', createdAt: new Date('2025-12-04'), updatedAt: new Date('2025-12-04') },
  { id: 'record-2025-12-05', userId: MOCK_USER_ID, date: '2025-12-05', achievementLevel: 'none', doText: 'なし', journalText: 'Bronze 7日中4日未達...レベルダウン', createdAt: new Date('2025-12-05'), updatedAt: new Date('2025-12-05') },

  // ========================================
  // Bronze Lv.2 期間: 2025/12/06 - 2025/12/19 (14日連続達成でレベルアップ)
  // Silver Lv.1 継続期間: 2025/11/22 - 2025/12/12
  // Gold Lv.2 期間: 2025/11/29 - 2025/12/15 (継続)
  // ========================================
  { id: 'record-2025-12-06', userId: MOCK_USER_ID, date: '2025-12-06', achievementLevel: 'gold', doText: '机に座って作業再開\nテストも書いた', journalText: '目標調整後、再スタート', createdAt: new Date('2025-12-06'), updatedAt: new Date('2025-12-06') },
  { id: 'record-2025-12-07', userId: MOCK_USER_ID, date: '2025-12-07', achievementLevel: 'silver', doText: '机に座って機能実装', journalText: '調子を取り戻してきた', createdAt: new Date('2025-12-07'), updatedAt: new Date('2025-12-07') },
  { id: 'record-2025-12-08', userId: MOCK_USER_ID, date: '2025-12-08', achievementLevel: 'gold', doText: '座って開発\nテスト完了', journalText: '順調', createdAt: new Date('2025-12-08'), updatedAt: new Date('2025-12-08') },
  { id: 'record-2025-12-09', userId: MOCK_USER_ID, date: '2025-12-09', achievementLevel: 'bronze', doText: '机に座った', journalText: '最低限達成', createdAt: new Date('2025-12-09'), updatedAt: new Date('2025-12-09') },
  { id: 'record-2025-12-10', userId: MOCK_USER_ID, date: '2025-12-10', achievementLevel: 'gold', doText: '開発とテスト', journalText: '良いペース', createdAt: new Date('2025-12-10'), updatedAt: new Date('2025-12-10') },
  { id: 'record-2025-12-11', userId: MOCK_USER_ID, date: '2025-12-11', achievementLevel: 'silver', doText: '機能完成', journalText: '継続中', createdAt: new Date('2025-12-11'), updatedAt: new Date('2025-12-11') },
  { id: 'record-2025-12-12', userId: MOCK_USER_ID, date: '2025-12-12', achievementLevel: 'gold', doText: 'テストコード追加', journalText: 'Silver 14日達成（11/29-12/12）！', createdAt: new Date('2025-12-12'), updatedAt: new Date('2025-12-12') },

  // Silver Lv.2 期間: 2025/12/13 - null
  { id: 'record-2025-12-13', userId: MOCK_USER_ID, date: '2025-12-13', achievementLevel: 'gold', doText: '2機能完成\nテストも完了', journalText: 'Silver Lv.2スタート！', createdAt: new Date('2025-12-13'), updatedAt: new Date('2025-12-13') },
  { id: 'record-2025-12-14', userId: MOCK_USER_ID, date: '2025-12-14', achievementLevel: 'silver', doText: '2機能完成', journalText: '順調', createdAt: new Date('2025-12-14'), updatedAt: new Date('2025-12-14') },
  { id: 'record-2025-12-15', userId: MOCK_USER_ID, date: '2025-12-15', achievementLevel: 'gold', doText: '2機能完成とテスト', journalText: 'Gold 14日達成（12/02-12/15）！', createdAt: new Date('2025-12-15'), updatedAt: new Date('2025-12-15') },

  // ========================================
  // Bronze Lv.3 期間: 2025/12/20 - null (現在進行中)
  // Silver Lv.2 期間: 2025/12/13 - null (継続)
  // Gold Lv.3 期間: 2025/12/16 - null (現在進行中)
  // ========================================
  { id: 'record-2025-12-16', userId: MOCK_USER_ID, date: '2025-12-16', achievementLevel: 'gold', doText: 'ドキュメント整備完了', journalText: 'Gold Lv.3スタート！', createdAt: new Date('2025-12-16'), updatedAt: new Date('2025-12-16') },
  { id: 'record-2025-12-17', userId: MOCK_USER_ID, date: '2025-12-17', achievementLevel: 'silver', doText: '2機能実装', journalText: '継続', createdAt: new Date('2025-12-17'), updatedAt: new Date('2025-12-17') },
  { id: 'record-2025-12-18', userId: MOCK_USER_ID, date: '2025-12-18', achievementLevel: 'gold', doText: '2機能とドキュメント', journalText: '完璧', createdAt: new Date('2025-12-18'), updatedAt: new Date('2025-12-18') },
  { id: 'record-2025-12-19', userId: MOCK_USER_ID, date: '2025-12-19', achievementLevel: 'bronze', doText: '机に座った', journalText: 'Bronze 14日達成（12/06-12/19）！', createdAt: new Date('2025-12-19'), updatedAt: new Date('2025-12-19') },
  { id: 'record-2025-12-20', userId: MOCK_USER_ID, date: '2025-12-20', achievementLevel: 'gold', doText: '30分集中\nドキュメント整備', journalText: 'Bronze Lv.3スタート！', createdAt: new Date('2025-12-20'), updatedAt: new Date('2025-12-20') },
  { id: 'record-2025-12-21', userId: MOCK_USER_ID, date: '2025-12-21', achievementLevel: 'silver', doText: '30分集中して2機能実装', journalText: '順調', createdAt: new Date('2025-12-21'), updatedAt: new Date('2025-12-21') },
  { id: 'record-2025-12-22', userId: MOCK_USER_ID, date: '2025-12-22', achievementLevel: 'gold', doText: '30分集中\n2機能とドキュメント', journalText: '完璧', createdAt: new Date('2025-12-22'), updatedAt: new Date('2025-12-22') },
  { id: 'record-2025-12-23', userId: MOCK_USER_ID, date: '2025-12-23', achievementLevel: 'bronze', doText: '30分だけ頑張った', journalText: '最低限', createdAt: new Date('2025-12-23'), updatedAt: new Date('2025-12-23') },
  { id: 'record-2025-12-24', userId: MOCK_USER_ID, date: '2025-12-24', achievementLevel: 'gold', doText: '30分集中\nドキュメント完璧', journalText: 'クリスマスイブも頑張った', createdAt: new Date('2025-12-24'), updatedAt: new Date('2025-12-24') },
  { id: 'record-2025-12-25', userId: MOCK_USER_ID, date: '2025-12-25', achievementLevel: 'silver', doText: '30分集中して2機能', journalText: 'クリスマスも継続', createdAt: new Date('2025-12-25'), updatedAt: new Date('2025-12-25') },
  { id: 'record-2025-12-26', userId: MOCK_USER_ID, date: '2025-12-26', achievementLevel: 'gold', doText: '30分集中\nドキュメント整備', journalText: '7日連続達成！', createdAt: new Date('2025-12-26'), updatedAt: new Date('2025-12-26') },

  // 直近のデータ（最新14日分も含む）
  { id: 'record-2025-12-27', userId: MOCK_USER_ID, date: '2025-12-27', achievementLevel: 'bronze', doText: '30分作業', journalText: '継続中', createdAt: new Date('2025-12-27'), updatedAt: new Date('2025-12-27') },
  { id: 'record-2025-12-28', userId: MOCK_USER_ID, date: '2025-12-28', achievementLevel: 'silver', doText: '2機能実装', journalText: '順調', createdAt: new Date('2025-12-28'), updatedAt: new Date('2025-12-28') },
  { id: 'record-2025-12-29', userId: MOCK_USER_ID, date: '2025-12-29', achievementLevel: 'gold', doText: 'ドキュメント整備完了', journalText: '完璧', createdAt: new Date('2025-12-29'), updatedAt: new Date('2025-12-29') },
  { id: 'record-2025-12-30', userId: MOCK_USER_ID, date: '2025-12-30', achievementLevel: 'bronze', doText: '30分学習', journalText: '年末も継続', createdAt: new Date('2025-12-30'), updatedAt: new Date('2025-12-30') },
  { id: 'record-2025-12-31', userId: MOCK_USER_ID, date: '2025-12-31', achievementLevel: 'gold', doText: 'ドキュメント完璧に整備', journalText: '大晦日も頑張った！', createdAt: new Date('2025-12-31'), updatedAt: new Date('2025-12-31') },
  { id: 'record-2026-01-01', userId: MOCK_USER_ID, date: '2026-01-01', achievementLevel: 'silver', doText: '2機能実装', journalText: '新年スタート', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
  { id: 'record-2026-01-02', userId: MOCK_USER_ID, date: '2026-01-02', achievementLevel: 'gold', doText: 'ドキュメント整備', journalText: '順調', createdAt: new Date('2026-01-02'), updatedAt: new Date('2026-01-02') },
  { id: 'record-2026-01-03', userId: MOCK_USER_ID, date: '2026-01-03', achievementLevel: 'bronze', doText: '30分作業', journalText: '継続', createdAt: new Date('2026-01-03'), updatedAt: new Date('2026-01-03') },
  { id: 'record-2026-01-04', userId: MOCK_USER_ID, date: '2026-01-04', achievementLevel: 'silver', doText: '2機能完成', journalText: '調子良い', createdAt: new Date('2026-01-04'), updatedAt: new Date('2026-01-04') },
  { id: 'record-2026-01-05', userId: MOCK_USER_ID, date: '2026-01-05', achievementLevel: 'gold', doText: 'ドキュメント整備完了', journalText: '完璧', createdAt: new Date('2026-01-05'), updatedAt: new Date('2026-01-05') },
  { id: 'record-2026-01-06', userId: MOCK_USER_ID, date: '2026-01-06', achievementLevel: 'bronze', doText: '30分学習', journalText: '最低限達成', createdAt: new Date('2026-01-06'), updatedAt: new Date('2026-01-06') },
  { id: 'record-2026-01-07', userId: MOCK_USER_ID, date: '2026-01-07', achievementLevel: 'silver', doText: '2機能実装', journalText: '継続中', createdAt: new Date('2026-01-07'), updatedAt: new Date('2026-01-07') },
];

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
      levelNumber: 1, // Lv.1
      content: '机に座る',
      startDate: '2025-11-01',
      endDate: '2025-11-14',
      transitionType: 'level_up', // 14日連続達成でレベルアップ
    },
    // 期間2: レベルアップ (2025/11/15 - 2025/12/05, 21日間)
    {
      id: 'bronze-card-2',
      level: 'bronze',
      levelNumber: 2, // Lv.2
      content: '30分集中する',
      startDate: '2025-11-15',
      endDate: '2025-12-05',
      transitionType: 'level_down', // 7日中4日未達でレベルダウン
    },
    // 期間3: レベルダウン (2025/12/06 - 2025/12/19, 14日間)
    {
      id: 'bronze-card-3',
      level: 'bronze',
      levelNumber: 2, // Lv.2（レベルダウン時は横ばい）
      content: '机に座る（調整後）',
      startDate: '2025-12-06',
      endDate: '2025-12-19',
      transitionType: 'level_up', // 再度14日連続達成
    },
    // 期間4: 現在進行中 (2025/12/20 - null)
    {
      id: 'bronze-card-4',
      level: 'bronze',
      levelNumber: 3, // Lv.3
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
      levelNumber: 1, // Lv.1
      content: '1機能完成させる',
      startDate: '2025-11-01',
      endDate: '2025-11-21',
      transitionType: null, // 変更なし（継続）
    },
    // 期間2: 継続 (2025/11/22 - 2025/12/12, 21日間)
    {
      id: 'silver-card-2',
      level: 'silver',
      levelNumber: 1, // Lv.1（変更なし）
      content: '1機能完成させる',
      startDate: '2025-11-22',
      endDate: '2025-12-12',
      transitionType: 'level_up', // 14日連続達成でレベルアップ
    },
    // 期間3: レベルアップ (2025/12/13 - null)
    {
      id: 'silver-card-3',
      level: 'silver',
      levelNumber: 2, // Lv.2
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
      levelNumber: 1, // Lv.1
      content: 'リファクタまで完了',
      startDate: '2025-11-01',
      endDate: '2025-11-28',
      transitionType: 'level_up', // 14日連続達成でレベルアップ
    },
    // 期間2: レベルアップ (2025/11/29 - 2025/12/15, 17日間)
    {
      id: 'gold-card-2',
      level: 'gold',
      levelNumber: 2, // Lv.2
      content: 'テストコードも書く',
      startDate: '2025-11-29',
      endDate: '2025-12-15',
      transitionType: 'level_up', // さらにレベルアップ
    },
    // 期間3: さらにレベルアップ (2025/12/16 - null)
    {
      id: 'gold-card-3',
      level: 'gold',
      levelNumber: 3, // Lv.3
      content: 'ドキュメントも整備する',
      startDate: '2025-12-16',
      endDate: null,
      transitionType: null,
      currentStreak: 5, // 現在5日連続達成中
    },
  ],
};
