import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "로그인 | AstroLog",
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      {/* 화면 왼쪽을 채우는 이미지 */}
      <div
        className="auth-background auth-background-login"
        style={{
          backgroundImage: 'url("/images/home/moon.png")',
        }}
        aria-hidden="true"
      >
        <div className="auth-background-overlay" />
      </div>

      {/* 실제 콘텐츠는 모두 1280px 안 */}
      <div className="container auth-layout">
        <section className="auth-copy">
          <h1 className="display-en">
            YOUR SKY,
            <br />
            YOUR
            <br />
            OBSERVATIONS.
          </h1>

          <p>오늘의 밤하늘로 다시 돌아오세요.</p>
        </section>

        <section className="auth-content">
          <div className="auth-content-inner">
            <h2 className="heading-ko">
              다시 밤하늘로
              <br />
              돌아오세요.
            </h2>

            <p className="auth-description">AstroLog에 로그인하고 관측 기록을 이어가세요.</p>

            <Suspense>
              <LoginForm />
            </Suspense>

            <div className="auth-divider">
              <span />
              <p>또는</p>
              <span />
            </div>

            <button type="button" className="google-auth-button">
              <img src="/images/auth/google.png" alt="" className="google-auth-icon" />
              Google로 계속하기
            </button>

            <p className="auth-switch">
              아직 계정이 없나요? <Link href="/signup">회원가입</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
