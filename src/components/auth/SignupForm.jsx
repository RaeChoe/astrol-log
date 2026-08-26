"use client";

/*
 * SignupForm
 *
 * [역할]
 * - 이메일 / 비밀번호 / 닉네임 회원가입
 *
 * [데이터 흐름]
 * 사용자 입력
 *   ↓
 * Supabase Auth signUp()
 *   ↓
 * auth.users 생성
 *   ↓
 * DB의 handle_new_user 트리거
 *   ↓
 * profiles 자동 생성
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();

    setErrorMessage("");

    if (!email || !password || !passwordConfirm || !nickname) {
      setErrorMessage("모든 항목을 입력해주세요.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/login?signup=success");
    router.refresh();
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label htmlFor="signup-email">이메일</label>

        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="이메일을 입력하세요"
          autoComplete="email"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signup-password">비밀번호</label>

        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="8자 이상 입력해주세요"
          autoComplete="new-password"
        />

        <span className="auth-help">8자 이상 입력해주세요.</span>
      </div>

      <div className="auth-field">
        <label htmlFor="signup-password-confirm">비밀번호 확인</label>

        <input
          id="signup-password-confirm"
          type="password"
          value={passwordConfirm}
          onChange={event => setPasswordConfirm(event.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          autoComplete="new-password"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="signup-nickname">닉네임</label>

        <input
          id="signup-nickname"
          type="text"
          value={nickname}
          onChange={event => setNickname(event.target.value)}
          placeholder="사용할 닉네임을 입력하세요"
          maxLength={30}
        />
      </div>

      {errorMessage && <p className="auth-error">{errorMessage}</p>}

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? "가입 중..." : "회원가입"}
      </button>
    </form>
  );
}
