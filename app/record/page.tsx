'use client';

// 記録・日報画面（シンプル版）

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { DailyRecord } from '@/types';
import { formatDate, getLevelBadgeClass } from '@/lib/utils';
import type { AchievementLevel } from '@/types';

export default function RecordPage() {
  const router = useRouter();
  const today = formatDate(new Date());

  // ローカル状態
  const [achievementLevel, setAchievementLevel] = useState<AchievementLevel>('none');
  const [learningContent, setLearningContent] = useState(''); // 学習内容サマリー
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(true);

  // 初期データ取得
  useEffect(() => {
    async function loadData() {
      try {
        // 今日の記録が既にあるかチェック
        const response = await fetch(`/api/daily-records?date=${today}`);
        if (!response.ok) {
          throw new Error('Failed to fetch daily record');
        }

        const existingRecord: DailyRecord | null = await response.json();
        if (existingRecord) {
          // 既に記録がある場合は日詳細ページへリダイレクト
          router.push(`/day/${today}`);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    }

    loadData();
  }, [today, router]);

  // 保存処理
  const handleSubmit = async () => {
    if (achievementLevel === 'none') {
      alert('達成度を選択してください');
      return;
    }

    try {
      // 日次記録を作成（API経由）
      const response = await fetch('/api/daily-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          achievementLevel,
          doText: learningContent.trim() || 'なし',
          journalText: journal || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create daily record');
      }

      // ホーム画面へ遷移
      router.push('/');
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('記録の保存に失敗しました');
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="記録・日報">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="記録・日報">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 学習内容サマリー（必須） */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">学習内容サマリー</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              今日は何を学びましたか？（必須）
            </label>
            <textarea
              value={learningContent}
              onChange={e => setLearningContent(e.target.value)}
              placeholder="なし"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
            />
            <p className="text-xs text-slate-500 mt-1">
              箇条書き形式で入力してください。何も作業していない場合は「なし」と入力。
            </p>
          </div>
        </section>

        {/* 目標達成度 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">目標達成度</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['bronze', 'silver', 'gold'] as const).map(level => {
              const labels = {
                bronze: { main: '最低限', example: '30分だけ座る' },
                silver: { main: '計画通り', example: '1機能完成' },
                gold: { main: '期待以上', example: 'リファクタまで完了' }
              };

              return (
                <button
                  key={level}
                  onClick={() => setAchievementLevel(level)}
                  className={`border-2 rounded-lg p-4 text-left transition-all ${
                    achievementLevel === level
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${getLevelBadgeClass(
                      level
                    )}`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                  <p className="text-sm font-medium text-slate-800 mb-1">
                    {labels[level].main}
                  </p>
                  <p className="text-xs text-slate-500">{labels[level].example}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 自由記述（Journal） */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">自由記述（任意）</h2>
          <textarea
            placeholder="今日感じたこと、学んだこと、自分への褒め言葉など"
            value={journal}
            onChange={e => setJournal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </section>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={achievementLevel === 'none'}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              achievementLevel === 'none'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            記録を確定してロックする
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
