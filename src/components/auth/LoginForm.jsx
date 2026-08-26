"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const signupSuccess = searchParams.get("signup") === "success";

  const handleSubmit = async event => {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("이메일 또는 비밀번호를 확인해주세요.");

      setLoading(false);
      return;
    }

    const next = searchParams.get("next");

    router.push(next || "/");
    router.refresh();
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {signupSuccess && <p className="auth-success">회원가입이 완료되었습니다. 로그인해주세요.</p>}

      <div className="auth-field">
        <label htmlFor="login-email">이메일</label>

        <input
          id="login-email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="이메일을 입력하세요"
          autoComplete="email"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="login-password">비밀번호</label>

        <input
          id="login-password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />
      </div>

      <div className="auth-forgot-row">
        <button type="button">비밀번호를 잊으셨나요?</button>
      </div>

      {errorMessage && <p className="auth-error">{errorMessage}</p>}

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
