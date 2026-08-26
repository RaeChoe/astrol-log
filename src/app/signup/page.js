import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "회원가입 | AstroLog",
};

export default function SignupPage() {
  return (
    <main className="auth-page">
      <section
        className="auth-visual"
        style={{
          backgroundImage: 'url("/images/home/saturn-event.png")',
        }}
      >
        <div className="auth-visual-overlay" />

        <div className="auth-visual-copy">
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
        </div>
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

          <button type="button" className="google-auth-button">
            <span>G</span>
            Google로 계속하기
          </button>

          <p className="auth-switch">
            이미 계정이 있나요? <Link href="/login">로그인</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
