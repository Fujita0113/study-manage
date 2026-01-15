import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server Component用の認証ヘルパー関数
 */

/**
 * 現在ログイン中のユーザー情報を取得
 * @returns ユーザー情報、未認証の場合はnull
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
}

/**
 * 認証を必須とし、未認証の場合はログイン画面へリダイレクト
 * Server Componentから呼び出す
 * @returns ユーザー情報
 */
export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
