'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('メールアドレスを入力してください');
      setLoading(false);
      return;
    }

    const result = await resetPassword(email);

    if (result.error) {
      setError('リセットメールの送信に失敗しました。もう一度お試しください。');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-600">
          送信完了
        </h1>
        <div className="space-y-4 text-center">
          <p className="text-gray-700">
            パスワードリセット用のメールを送信しました。
          </p>
          <p className="text-gray-700">
            メール内のリンクをクリックして、新しいパスワードを設定してください。
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              ログイン画面へ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">パスワードリセット</h1>

      <p className="text-sm text-gray-600 mb-6 text-center">
        登録したメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example@email.com"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'メール送信中...' : 'リセットメールを送信'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 hover:underline">
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}
