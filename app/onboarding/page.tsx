'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TodoList } from '@/components/todo';
import { GoalLevel } from '@/types';

interface TodoItem {
  id?: string;
  content: string;
}

/**
 * 初期目標設定フォームコンポーネント
 */
function OnboardingForm() {
  const searchParams = useSearchParams();
  const [bronzeTodos, setBronzeTodos] = useState<TodoItem[]>([]);
  const [silverTodos, setSilverTodos] = useState<TodoItem[]>([]);
  const [goldTodos, setGoldTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // デバッグモードのチェック（URLパラメータまたは開発環境）
  useEffect(() => {
    // URLパラメータでデバッグモードを有効化
    const urlDebug = searchParams.get('debug') === 'true';
    // 開発環境の判定（localhostまたは127.0.0.1）
    const isDev = typeof window !== 'undefined' &&
                  (window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1');
    const isDebug = urlDebug || isDev;
    setDebugMode(isDebug);
    if (isDebug) {
      console.log('[Onboarding] Debug mode enabled - redirect will be delayed (10 seconds)');
      console.log('[Onboarding] Check browser console and server terminal for detailed logs');
    }
  }, [searchParams]);

  // 全ての目標が1つ以上入力されているかチェック
  const isFormValid = bronzeTodos.length > 0 && silverTodos.length > 0 && goldTodos.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[Onboarding] handleSubmit called');
    e.preventDefault();

    console.log('[Onboarding] Form values:', { bronzeTodos, silverTodos, goldTodos });
    console.log('[Onboarding] isFormValid:', isFormValid);

    if (!isFormValid) {
      console.log('[Onboarding] Form validation failed');
      setError('各レベルに少なくとも1つのTODOを設定してください');
      return;
    }

    console.log('[Onboarding] Setting loading state...');
    setIsLoading(true);
    setError('');

    try {
      console.log('[Onboarding] Sending fetch request...');
      const response = await fetch('/api/goals/initial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bronze: bronzeTodos.map(t => t.content).join('\n'),
          silver: silverTodos.map(t => t.content).join('\n'),
          gold: goldTodos.map(t => t.content).join('\n'),
          // TODOリストも送信（将来の拡張用）
          bronzeTodos: bronzeTodos.map(t => t.content),
          silverTodos: silverTodos.map(t => t.content),
          goldTodos: goldTodos.map(t => t.content),
        }),
      });

      console.log('[Onboarding] Response received:', response.status, response.ok);

      // レスポンスのContent-Typeをチェック
      const contentType = response.headers.get('content-type');
      console.log('[Onboarding] Content-Type:', contentType);

      if (!response.ok) {
        // エラー時はJSONを読み取る
        let errorMessage = '目標の保存に失敗しました';
        try {
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            console.log('[Onboarding] Error response:', data);
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            console.log('[Onboarding] Error response (non-JSON):', text);
          }
        } catch (parseError) {
          console.error('[Onboarding] Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // 成功時はレスポンスを読み取って、処理が完了したことを確認
      try {
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log('[Onboarding] Success response:', data);
        } else {
          // JSONでない場合はテキストとして読み取る（通常は発生しない）
          const text = await response.text();
          console.log('[Onboarding] Success response (non-JSON):', text);
        }
      } catch (parseError) {
        console.warn('[Onboarding] Failed to parse success response:', parseError);
        // パースエラーでもリダイレクトは実行する（API処理は完了している可能性が高い）
      }

      console.log('[Onboarding] Goals saved successfully');
      console.log('[Onboarding] Success timestamp:', new Date().toISOString());
      console.log('[Onboarding] Current URL:', window.location.href);
      console.log('[Onboarding] Debug mode:', debugMode);

      // 成功メッセージを表示
      setSuccessMessage('目標の保存に成功しました！');
      setIsLoading(false);

      // デバッグモードの場合はリダイレクトを無効化または大幅に遅延
      if (debugMode) {
        console.log('[Onboarding] DEBUG MODE: Redirect disabled. Check console and server logs.');
        console.log('[Onboarding] To enable redirect, remove ?debug=true from URL or set NODE_ENV=production');
        console.log('[Onboarding] All logs are available in browser console and server terminal.');
        // デバッグモードでも10秒後にリダイレクト（手動でリロードできるように）
        setTimeout(() => {
          console.log('[Onboarding] DEBUG MODE: Auto-redirecting after 10 seconds...');
          window.location.href = '/';
        }, 10000);
      } else {
        // 本番モード: 通常のリダイレクト
        console.log('[Onboarding] About to redirect to /');
        setTimeout(() => {
          console.log('[Onboarding] Executing redirect now...');
          window.location.href = '/';
        }, 200);
      }
    } catch (err) {
      console.error('[Onboarding] Error saving goals:', err);
      setError(err instanceof Error ? err.message : '目標の保存に失敗しました');
      setIsLoading(false);
    }
  };

  const levelConfig: Record<GoalLevel, { label: string; description: string; color: string; bgColor: string; placeholder: string }> = {
    bronze: {
      label: 'Bronze',
      description: '最低限の目標',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      placeholder: '例：30分だけ座って作業する',
    },
    silver: {
      label: 'Silver',
      description: '計画通りの目標',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      placeholder: '例：1機能を完成させる',
    },
    gold: {
      label: 'Gold',
      description: '期待以上の目標',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      placeholder: '例：リファクタリングまで完了する',
    },
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
      {/* タイトル */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          目標を設定しましょう
        </h1>
        <p className="text-slate-600">
          学習を続けるために、3つのレベルの目標を設定します。
          <br />
          各レベルには複数のTODOを設定できます。
        </p>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bronze目標 */}
        <div className={`rounded-lg ${levelConfig.bronze.bgColor} p-4`}>
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 bg-bronze text-white rounded-md mr-2 text-sm font-medium`}>
              Bronze
            </span>
            <span className="text-sm text-slate-600">{levelConfig.bronze.description}</span>
          </div>
          <TodoList
            todos={bronzeTodos}
            onChange={setBronzeTodos}
            maxItems={5}
            placeholder={levelConfig.bronze.placeholder}
            disabled={isLoading}
          />
        </div>

        {/* Silver目標 */}
        <div className={`rounded-lg ${levelConfig.silver.bgColor} p-4`}>
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 bg-silver text-white rounded-md mr-2 text-sm font-medium`}>
              Silver
            </span>
            <span className="text-sm text-slate-600">{levelConfig.silver.description}</span>
          </div>
          <TodoList
            todos={silverTodos}
            onChange={setSilverTodos}
            maxItems={5}
            placeholder={levelConfig.silver.placeholder}
            disabled={isLoading}
          />
        </div>

        {/* Gold目標 */}
        <div className={`rounded-lg ${levelConfig.gold.bgColor} p-4`}>
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 bg-gold text-white rounded-md mr-2 text-sm font-medium`}>
              Gold
            </span>
            <span className="text-sm text-slate-600">{levelConfig.gold.description}</span>
          </div>
          <TodoList
            todos={goldTodos}
            onChange={setGoldTodos}
            maxItems={5}
            placeholder={levelConfig.gold.placeholder}
            disabled={isLoading}
          />
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 成功メッセージ（デバッグモード時） */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="font-medium mb-2">{successMessage}</div>
            {debugMode && (
              <div className="text-sm mt-2">
                <p className="mb-2">デバッグモードが有効です。リダイレクトは10秒後に実行されます。</p>
                <p className="text-xs text-green-600">
                  ログを確認してください（ブラウザのコンソールとサーバーのターミナル）
                </p>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Onboarding] Manual redirect triggered');
                    window.location.href = '/';
                  }}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  手動でリダイレクト
                </button>
              </div>
            )}
          </div>
        )}

        {/* 保存ボタン */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '保存中...' : '目標を保存して開始'}
        </button>
      </form>
    </div>
  );
}

/**
 * 初期目標設定画面
 * 初回ログイン時に3つの目標を設定する
 */
export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-center">読み込み中...</div>}>
        <OnboardingForm />
      </Suspense>
    </div>
  );
}
