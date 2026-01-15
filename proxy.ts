import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 認証が必要なパス（認証画面以外）
  const isAuthPath = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/reset-password');

  const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding');
  
  // API Routeの場合は目標チェックをスキップ（API Routeは独自に認証チェックを行う）
  const isApiPath = request.nextUrl.pathname.startsWith('/api');

  // 未認証ユーザーが認証画面以外にアクセスしようとした場合（API Routeは除外）
  if (!user && !isAuthPath && !isApiPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 認証済みユーザーが認証画面にアクセスしようとした場合
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 認証済みユーザーの場合、目標の有無をチェック（API Routeは除外）
  if (user && !isAuthPath && !isApiPath) {
    const checkStartTime = Date.now();
    console.log(`[Middleware] Checking goals for user ${user.id} at path ${request.nextUrl.pathname}`);
    console.log(`[Middleware] Timestamp: ${new Date().toISOString()}`);
    
    // 目標の有無をチェック（goalsテーブルから取得）
    // キャッシュを無効化して最新のデータを取得
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, level, description, created_at')
      .eq('user_id', user.id);

    const checkTime = Date.now() - checkStartTime;
    
    let hasGoals = false;
    
    if (goalsError) {
      console.error('[Middleware] Error fetching goals:', goalsError);
      console.error('[Middleware] Error details:', JSON.stringify(goalsError, null, 2));
      // エラー時は目標未設定として扱う（安全側に倒す）
      hasGoals = false;
      console.log(`[Middleware] hasGoals: ${hasGoals} (error occurred, treating as no goals)`);
    } else {
      console.log(`[Middleware] Goals query completed (took ${checkTime}ms):`, {
        count: goals?.length || 0,
        goals: goals?.map(g => ({ id: g.id, level: g.level, created_at: g.created_at }))
      });
      
      hasGoals = goals && goals.length === 3;
      if (!hasGoals && goals && goals.length > 0) {
        console.warn(`[Middleware] Unexpected goal count: ${goals.length} (expected 3)`);
      }
      console.log(`[Middleware] hasGoals: ${hasGoals} (expected: 3 goals, actual: ${goals?.length || 0})`);
    }

    // 目標未設定かつ/onboarding以外にアクセスしようとした場合
    if (!hasGoals && !isOnboardingPath) {
      console.log(`[Middleware] Redirecting to /onboarding (no goals)`);
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // 目標設定済みかつ/onboardingにアクセスしようとした場合
    if (hasGoals && isOnboardingPath) {
      console.log(`[Middleware] Redirecting to / (goals already set)`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    console.log(`[Middleware] No redirect needed`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
