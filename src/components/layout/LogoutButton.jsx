"use client";

/*
 * LogoutButton
 *
 * [역할]
 * - Supabase 세션 로그아웃
 * - 로그아웃 완료 후 메인 페이지 이동
 * - router.refresh()를 호출하여
 *   Server Component인 Header의 사용자 정보를 갱신
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("로그아웃 오류:", error);

      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      className="header-logout-button"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
