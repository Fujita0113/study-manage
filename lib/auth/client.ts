'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

/**
 * Client Component用の認証ヘルパー関数
 */

const supabase = createClient();

/**
 * サインアップ（新規ユーザー登録）
 * @param email メールアドレス
 * @param password パスワード
 * @returns 成功時はユーザー情報、失敗時はエラー
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * ログイン
 * @param email メールアドレス
 * @param password パスワード
 * @returns 成功時はユーザー情報、失敗時はエラー
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

/**
 * ログアウト
 * @returns 成功時は空オブジェクト、失敗時はエラー
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * パスワードリセットメールを送信
 * @param email メールアドレス
 * @returns 成功時は空オブジェクト、失敗時はエラー
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password/confirm`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * 認証状態を管理するReact Hook
 * @returns 現在のユーザー情報とローディング状態
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 初回のユーザー情報取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        router.refresh();
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return { user, loading };
}
