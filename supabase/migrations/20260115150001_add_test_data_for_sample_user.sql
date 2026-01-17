-- サンプルユーザー用のテストデータ追加
-- user_id: b58180f4-3421-4e02-8903-e54d5acee1e9

-- user_settingsテーブルにサンプルユーザーを追加（存在しない場合のみ）
INSERT INTO public.user_settings (id, created_at, updated_at)
VALUES (
  'b58180f4-3421-4e02-8903-e54d5acee1e9',
  '2026-01-01 00:00:00+00',
  '2026-01-01 00:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- goalsテーブルにサンプルユーザーの目標を追加（既存データがあれば削除してから追加）
DELETE FROM public.goals WHERE user_id = 'b58180f4-3421-4e02-8903-e54d5acee1e9';

INSERT INTO public.goals (id, user_id, level, description, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'bronze', '毎日30分プログラミングする', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'silver', '1つの機能を完成させる', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'gold', 'リファクタリングまで完了させる', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

-- goal_history_slotsテーブルにサンプルユーザーの履歴を追加（既存データがあれば削除してから追加）
DELETE FROM public.goal_history_slots WHERE user_id = 'b58180f4-3421-4e02-8903-e54d5acee1e9';

INSERT INTO public.goal_history_slots (id, user_id, bronze_goal, silver_goal, gold_goal, start_date, end_date, change_reason, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '毎日30分プログラミングする', '1つの機能を完成させる', 'リファクタリングまで完了させる', '2026-01-01', NULL, 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');

-- daily_recordsテーブルにサンプルユーザーの学習記録を追加（既存データがあれば削除してから追加）
DELETE FROM public.daily_records WHERE user_id = 'b58180f4-3421-4e02-8903-e54d5acee1e9';

INSERT INTO public.daily_records (id, user_id, date, achievement_level, do_text, journal_text, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-01', 'bronze', 'データベースの基礎を学習', 'SQLの基本が理解できた。', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-02', 'bronze', 'APIの設計について学習', 'RESTfulな設計の重要性が分かった。', '2026-01-02 00:00:00+00', '2026-01-02 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-03', 'silver', 'Git/GitHubの使い方を復習', 'ブランチの使い方が理解できた。', '2026-01-03 00:00:00+00', '2026-01-03 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-04', 'silver', 'コードレビューの観点を学習', '他人のコードを読む練習になった。', '2026-01-04 00:00:00+00', '2026-01-04 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-05', 'gold', 'テストコードの書き方を学習', 'Jestの基本的な使い方が分かった。', '2026-01-05 00:00:00+00', '2026-01-05 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-06', 'gold', 'パフォーマンス最適化について学習', '遅延読み込みの重要性が理解できた。', '2026-01-06 00:00:00+00', '2026-01-06 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-07', 'silver', 'セキュリティについて学習', 'XSS対策の重要性が分かった。', '2026-01-07 00:00:00+00', '2026-01-07 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-08', 'bronze', 'アクセシビリティについて学習', 'WAI-ARIAの基本が理解できた。', '2026-01-08 00:00:00+00', '2026-01-08 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-09', 'silver', 'デプロイ方法について学習', 'Vercelの使い方が分かった。', '2026-01-09 00:00:00+00', '2026-01-09 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-10', 'gold', 'モニタリング・ログ管理について学習', '成長を実感できている。', '2026-01-10 00:00:00+00', '2026-01-10 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-11', 'silver', 'CI/CDパイプライン構築', '自動化の重要性が分かった。', '2026-01-11 00:00:00+00', '2026-01-11 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-12', 'bronze', 'ドキュメント作成', '伝わる文章を意識した。', '2026-01-12 00:00:00+00', '2026-01-12 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-13', 'gold', 'パフォーマンスチューニング', '最適化のコツが掴めた。', '2026-01-13 00:00:00+00', '2026-01-13 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', '2026-01-14', 'gold', 'リファクタリング実践', '14日連続達成！少しずつ成長している。', '2026-01-14 00:00:00+00', '2026-01-14 00:00:00+00');

-- goal_level_historyテーブルにサンプルユーザーのレベル履歴を追加（既存データがあれば削除してから追加）
DELETE FROM public.goal_level_history WHERE user_id = 'b58180f4-3421-4e02-8903-e54d5acee1e9';

INSERT INTO public.goal_level_history (id, user_id, goal_type, level, goal_content, started_at, ended_at, change_reason, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'bronze', 1, '毎日30分プログラミングする', '2026-01-01 00:00:00+00', NULL, 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'silver', 1, '1つの機能を完成させる', '2026-01-01 00:00:00+00', NULL, 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'),
  (gen_random_uuid(), 'b58180f4-3421-4e02-8903-e54d5acee1e9', 'gold', 1, 'リファクタリングまで完了させる', '2026-01-01 00:00:00+00', NULL, 'initial', '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00');
