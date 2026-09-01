"use client";

import Link from "next/link";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("페이지 렌더링 오류:", error);
  }, [error]);

  return (
    <main className="app-error-page">
      <div className="app-error-content">
        <span className="app-error-symbol" aria-hidden="true">
          ✦
        </span>

        <span className="section-label">SOMETHING WENT WRONG</span>

        <h1 className="heading-ko">정보를 불러오지 못했습니다</h1>

        <p>일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>

        <div className="app-error-actions">
          <button type="button" className="button button-primary" onClick={() => reset()}>
            다시 시도
          </button>

          <Link href="/" className="button button-secondary">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
