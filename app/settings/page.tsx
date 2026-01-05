'use client';

// 設定画面（実装計画書に従った実装）

import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings } from '@/lib/db';
import { MOCK_USER_ID } from '@/lib/mockData';
import type { UserSettings } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [githubRepo, setGithubRepo] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(true);

  // データ取得
  useEffect(() => {
    async function loadSettings() {
      try {
        const fetchedSettings = await getUserSettings(MOCK_USER_ID);
        setSettings(fetchedSettings);
        setGithubRepo(fetchedSettings.githubRepo || '');
        setGithubToken(''); // トークンは表示しない
        setLoading(false);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // 保存処理
  const handleSave = async () => {
    try {
      await updateUserSettings(MOCK_USER_ID, {
        githubRepo: githubRepo.trim() || undefined,
        githubToken: githubToken.trim() || undefined,
      });
      alert('設定を保存しました（モック実装のため、実際のAPI接続は行いません）');
      setGithubToken(''); // 保存後はトークンをクリア
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('設定の保存に失敗しました');
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="設定">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="設定">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* GitHub設定 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">GitHub設定</h2>
          <p className="text-sm text-slate-600 mb-6">
            GitHubリポジトリと連携して、コミット履歴をホーム画面に表示できます。
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                リポジトリURL
              </label>
              <input
                type="text"
                value={githubRepo}
                onChange={e => setGithubRepo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: owner/repository"
              />
              <p className="text-xs text-slate-500 mt-1">
                形式: owner/repository（例: facebook/react）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-slate-500 mt-1">
                GitHubのPersonal Access Tokenを入力してください。プライベートリポジトリの場合は必須です。
              </p>
              {settings?.githubToken && (
                <p className="text-xs text-green-600 mt-1">
                  トークンは既に保存されています
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              保存する
            </button>
          </div>
        </div>

        {/* ルール確認 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">ルール確認</h2>
          <p className="text-sm text-slate-600 mb-4">
            このアプリでは、以下のルールで目標のレベルアップ・レベルダウンを提案します。
          </p>

          <div className="space-y-3">
            <div className="border-l-4 border-green-500 bg-green-50 p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                レベルアップ提案
              </h3>
              <p className="text-sm text-green-700">
                同じレベルを14日連続で達成した場合、目標をレベルアップすることを提案します。
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                レベルダウン提案
              </h3>
              <p className="text-sm text-yellow-700">
                Bronze未達が4日以上続いた場合、目標をレベルダウンすることを提案します。無理のないペースで続けることが大切です。
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}



