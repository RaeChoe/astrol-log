import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "회원가입",
};

export default async function SignupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-page">
      {/* 화면 왼쪽을 채우는 이미지 */}
      <div
        className="auth-background auth-background-signup"
        style={{
          backgroundImage: 'url("/images/home/saturn-event.png")',
        }}
        aria-hidden="true"
      >
        <div className="auth-background-overlay" />
      </div>

      {/* 실제 콘텐츠는 모두 1280px 안 */}
      <div className="container auth-layout">
        <section className="auth-copy">
          <h1 className="display-en">
            START YOUR
            <br />
            NIGHT SKY
            <br />
            JOURNAL.
          </h1>

          <p>
            관측한 밤하늘을 기록하고
            <br />
            나만의 천체 도감을 완성해보세요.
          </p>
        </section>

        <section className="auth-content">
          <div className="auth-content-inner">
            <h2 className="heading-ko">
              나만의 관측 기록을
              <br />
              시작하세요.
            </h2>

            <p className="auth-description">AstroLog와 함께 당신만의 밤하늘을 기록해보세요.</p>

            <SignupForm />

            <div className="auth-divider">
              <span />
              <p>또는</p>
              <span />
            </div>

            <GoogleAuthButton />

            <p className="auth-switch">
              이미 계정이 있나요? <Link href="/login">로그인</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
