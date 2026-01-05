'use client';

// 記録・日報画面（実装計画書に従った実装）

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getEfforts,
  getDailyRecordByDate,
  createDailyRecord,
  createEffortEvaluation,
  updateEffort,
  createEffort
} from '@/lib/db';
import { formatDate, getLevelBadgeClass } from '@/lib/utils';
import { MOCK_USER_ID } from '@/lib/mockData';
import type {
  Effort,
  AchievementLevel,
  EffortExecuted,
  EffortEffectiveness,
  EffortNextAction,
  GoalLevel
} from '@/types';

interface EffortEvaluationForm {
  effortId: string;
  effort: Effort;
  executed: EffortExecuted;
  effectiveness: EffortEffectiveness;
  nextAction: EffortNextAction;
  reason?: string;
}

export default function RecordPage() {
  const router = useRouter();
  const today = formatDate(new Date());

  // ローカル状態
  const [activeEfforts, setActiveEfforts] = useState<Effort[]>([]);
  const [achievementLevel, setAchievementLevel] = useState<AchievementLevel>('none');
  const [effortEvaluations, setEffortEvaluations] = useState<EffortEvaluationForm[]>([]);
  const [newEffortTitle, setNewEffortTitle] = useState('');
  const [newEffortLevel, setNewEffortLevel] = useState<GoalLevel>('bronze');
  const [stepUpStrategy, setStepUpStrategy] = useState('');
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(true);

  // 初期データ取得
  useEffect(() => {
    async function loadData() {
      try {
        // 今日の記録が既にあるかチェック
        const existingRecord = await getDailyRecordByDate(today);
        if (existingRecord) {
          // 既に記録がある場合は日詳細ページへリダイレクト
          router.push(`/day/${today}`);
          return;
        }

        // アクティブな工夫を取得
        const efforts = await getEfforts(MOCK_USER_ID, { status: 'active' });
        setActiveEfforts(efforts);

        // 工夫評価の初期値を設定
        const initialEvaluations: EffortEvaluationForm[] = efforts.map(effort => ({
          effortId: effort.id,
          effort,
          executed: 'no',
          effectiveness: 'not_evaluated',
          nextAction: 'continue',
          reason: undefined
        }));
        setEffortEvaluations(initialEvaluations);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    }

    loadData();
  }, [today, router]);

  // 工夫評価の更新
  const updateEvaluation = (effortId: string, field: string, value: any) => {
    setEffortEvaluations(prev =>
      prev.map(ev =>
        ev.effortId === effortId ? { ...ev, [field]: value } : ev
      )
    );
  };

  // 保存処理
  const handleSubmit = async () => {
    if (achievementLevel === 'none') {
      alert('達成度を選択してください');
      return;
    }

    try {
      // 1. 日次記録を作成
      const dailyRecord = await createDailyRecord({
        date: today,
        achievementLevel,
        journalText: journal || undefined,
        stepUpStrategy: stepUpStrategy || undefined,
      });

      // 2. 工夫評価を保存
      for (const evaluation of effortEvaluations) {
        await createEffortEvaluation({
          dailyRecordId: dailyRecord.id,
          effortId: evaluation.effortId,
          executed: evaluation.executed,
          effectiveness: evaluation.effectiveness,
          nextAction: evaluation.nextAction,
          reason: evaluation.reason,
        });

        // 3. 工夫のステータスを更新
        if (evaluation.nextAction === 'stop') {
          await updateEffort(evaluation.effortId, { status: 'archived' });
        }
      }

      // 4. 新しい工夫を作成
      if (newEffortTitle.trim()) {
        await createEffort({
          goalLevel: newEffortLevel,
          title: newEffortTitle.trim(),
          description: undefined,
          status: 'active',
          activatedAt: new Date(),
        });
      }

      // 5. ホーム画面へ遷移
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
        {/* STEP 1: CHECK - 前日の工夫の答え合わせ */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            STEP 1: CHECK - 前日の工夫の答え合わせ
          </h2>
          {activeEfforts.length === 0 ? (
            <p className="text-sm text-slate-500">現在進行中の工夫がありません</p>
          ) : (
            <div className="space-y-4">
              {effortEvaluations.map(evaluation => (
                <div key={evaluation.effortId} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-slate-800">{evaluation.effort.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${getLevelBadgeClass(
                          evaluation.effort.goalLevel
                        )}`}
                      >
                        {evaluation.effort.goalLevel}
                      </span>
                    </div>
                    {evaluation.effort.description && (
                      <p className="text-sm text-slate-600">{evaluation.effort.description}</p>
                    )}
                  </div>

                  {/* 実行フラグ */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      実行できましたか？
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={evaluation.executed === 'yes'}
                          onChange={() => updateEvaluation(evaluation.effortId, 'executed', 'yes')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-600">できた</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={evaluation.executed === 'no'}
                          onChange={() => updateEvaluation(evaluation.effortId, 'executed', 'no')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-600">できなかった</span>
                      </label>
                    </div>
                  </div>

                  {/* 実感効果 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">効果はどうでしたか？</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={evaluation.effectiveness === 'excellent'}
                          onChange={() =>
                            updateEvaluation(evaluation.effortId, 'effectiveness', 'excellent')
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-600">最高</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={evaluation.effectiveness === 'moderate'}
                          onChange={() =>
                            updateEvaluation(evaluation.effortId, 'effectiveness', 'moderate')
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-600">微妙</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={evaluation.effectiveness === 'negative'}
                          onChange={() =>
                            updateEvaluation(evaluation.effortId, 'effectiveness', 'negative')
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-600">逆効果</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* STEP 2: DO - 今日の目標達成度 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">STEP 2: DO - 今日の目標達成度</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['bronze', 'silver', 'gold'] as const).map(level => (
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
                <p className="text-sm text-slate-600">クリックして選択</p>
              </button>
            ))}
          </div>
        </section>

        {/* STEP 3: ACT - 工夫のステータス更新 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            STEP 3: ACT - 工夫のステータス更新
          </h2>
          {effortEvaluations.length === 0 ? (
            <p className="text-sm text-slate-500">評価する工夫がありません</p>
          ) : (
            <div className="space-y-4">
              {effortEvaluations.map(evaluation => (
                <div key={evaluation.effortId} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-slate-800 mb-2">{evaluation.effort.title}</p>
                  <select
                    value={evaluation.nextAction}
                    onChange={e =>
                      updateEvaluation(evaluation.effortId, 'nextAction', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  >
                    <option value="continue">そのまま継続</option>
                    <option value="improve">改良して継続</option>
                    <option value="stop">今日で終了</option>
                  </select>
                  {(evaluation.nextAction === 'stop' || evaluation.nextAction === 'improve') && (
                    <textarea
                      placeholder={
                        evaluation.nextAction === 'stop' ? '終了理由を入力' : '改良案を入力'
                      }
                      value={evaluation.reason || ''}
                      onChange={e => updateEvaluation(evaluation.effortId, 'reason', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* STEP 4: PLAN - 新しい工夫 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            STEP 4: PLAN - 新しい工夫
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">工夫のレベル</label>
              <select
                value={newEffortLevel}
                onChange={e => setNewEffortLevel(e.target.value as GoalLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">工夫の内容</label>
              <textarea
                placeholder="明日を楽にするための工夫を入力（任意）"
                value={newEffortTitle}
                onChange={e => setNewEffortTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* STEP 5: Step-Up Strategy（条件付き表示） */}
        {achievementLevel !== 'gold' && achievementLevel !== 'none' && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              STEP 5: Step-Up Strategy
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              もし今日、一段上の目標を達成するとしたら、何が足りなかった？
            </p>
            <textarea
              placeholder="例：午後の睡魔対策が必要。15分の昼寝を導入する。"
              value={stepUpStrategy}
              onChange={e => setStepUpStrategy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
            />
          </section>
        )}

        {/* STEP 6: Journal - 自由記述 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">STEP 6: Journal - 自由記述</h2>
          <textarea
            placeholder="今日の感想や気づいたことを自由に書いてください"
            value={journal}
            onChange={e => setJournal(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={4}
          />
        </section>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            記録を確定してロックする
          </button>
        </div>
      </div>
    </AppLayout>
  );
}


