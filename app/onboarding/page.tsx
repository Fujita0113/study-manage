'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * 初期目標設定画面
 * 初回ログイン時に3つの目標を設定する
 */
export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bronze, setBronze] = useState('');
  const [silver, setSilver] = useState('');
  const [gold, setGold] = useState('');
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

  // 全ての目標が入力されているかチェック
  const isFormValid = bronze.trim() && silver.trim() && gold.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[Onboarding] handleSubmit called');
    e.preventDefault();

    console.log('[Onboarding] Form values:', { bronze, silver, gold });
    console.log('[Onboarding] isFormValid:', isFormValid);

    if (!isFormValid) {
      console.log('[Onboarding] Form validation failed');
      setError('すべての目標を入力してください');
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
          bronze: bronze.trim(),
          silver: silver.trim(),
          gold: gold.trim(),
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        {/* タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            目標を設定しましょう
          </h1>
          <p className="text-slate-600">
            学習を続けるために、3つのレベルの目標を設定します。
            <br />
            Bronze（最低限）、Silver（計画通り）、Gold（期待以上）の順に設定してください。
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bronze目標 */}
          <div>
            <label htmlFor="bronze" className="block text-sm font-medium text-slate-700 mb-2">
              <span className="inline-block px-3 py-1 bg-bronze text-white rounded-md mr-2">
                Bronze
              </span>
              最低限の目標
            </label>
            <input
              type="text"
              id="bronze"
              value={bronze}
              onChange={(e) => setBronze(e.target.value)}
              placeholder="例：30分だけ座って作業する"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bronze focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Silver目標 */}
          <div>
            <label htmlFor="silver" className="block text-sm font-medium text-slate-700 mb-2">
              <span className="inline-block px-3 py-1 bg-silver text-white rounded-md mr-2">
                Silver
              </span>
              計画通りの目標
            </label>
            <input
              type="text"
              id="silver"
              value={silver}
              onChange={(e) => setSilver(e.target.value)}
              placeholder="例：1機能を完成させる"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-silver focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Gold目標 */}
          <div>
            <label htmlFor="gold" className="block text-sm font-medium text-slate-700 mb-2">
              <span className="inline-block px-3 py-1 bg-gold text-white rounded-md mr-2">
                Gold
              </span>
              期待以上の目標
            </label>
            <input
              type="text"
              id="gold"
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              placeholder="例：リファクタリングまで完了する"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
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
    </div>
  );
}
