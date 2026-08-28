"use client";

/*
 * GoogleAuthButton
 *
 * [역할]
 * - Google OAuth 로그인 시작
 *
 * [흐름]
 * 버튼 클릭
 *   ↓
 * Supabase signInWithOAuth()
 *   ↓
 * Google 로그인/동의
 *   ↓
 * Supabase Auth callback
 *   ↓
 * /auth/callback
 *   ↓
 * code → session 교환
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function GoogleAuthButton() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const next = searchParams.get("next") || "/";

    const callbackUrl = new URL("/auth/callback", window.location.origin);

    callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",

      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      console.error("Google 로그인 오류:", error);

      setErrorMessage("Google 로그인을 시작하지 못했습니다.");

      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="google-auth-button"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <img src="/images/auth/google.png" alt="" className="google-auth-icon" />

        {loading ? "Google로 이동 중..." : "Google로 계속하기"}
      </button>

      {errorMessage && <p className="auth-error">{errorMessage}</p>}
    </>
  );
}
