/*
 * Google OAuth Callback
 *
 * [역할]
 * - Google OAuth 완료 후 Supabase가 전달한 code 처리
 * - code를 Supabase session으로 교환
 * - Google 사용자 profiles 데이터를 보정
 * - 완료 후 메인 페이지로 이동
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  let next = requestUrl.searchParams.get("next") || "/";

  // 외부 URL redirect 방지
  if (!next.startsWith("/")) {
    next = "/";
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
  }

  const supabase = await createClient();

  /*
   * OAuth authorization code
   * → Supabase session
   */
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("OAuth code 교환 오류:", exchangeError);

    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
  }

  const user = data.user;

  if (user) {
    const metadata = user.user_metadata || {};

    /*
     * Google metadata에서 사용 가능한 값 추출
     *
     * Google/Supabase 환경에 따라:
     * full_name
     * name
     * avatar_url
     * picture
     * 등이 들어올 수 있음.
     */
    const nickname =
      metadata.full_name || metadata.name || user.email?.split("@")[0] || "Stargazer";

    const avatarUrl = metadata.avatar_url || metadata.picture || null;

    /*
     * handle_new_user 트리거가 이미 profiles를 생성했을 가능성이 높음.
     *
     * callback에서는 Google 사용자 정보로
     * nickname/avatar_url을 보정.
     */
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        nickname,
        avatar_url: avatarUrl,
      })
      .eq("user_id", user.id);

    if (profileError) {
      console.error("Google 프로필 업데이트 오류:", profileError);
    }
  }

  /*
   * 로컬 환경
   */
  if (process.env.NODE_ENV === "development") {
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }

  /*
   * Vercel 등 Proxy/Load Balancer 환경
   */
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
