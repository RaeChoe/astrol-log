"use client";

/*
 * HeaderClient
 *
 * [역할]
 * - Header의 사용자 인터랙션 담당
 * - 현재 pathname에 따라 active navigation 표시
 * - 로그인 여부에 따라 로그인 링크 / 프로필 UI 표시
 *
 * [데이터 흐름]
 *
 * Header.jsx (Server Component)
 *   ↓
 * Supabase Auth 사용자 조회
 *   ↓
 * profiles 조회
 *   ↓
 * HeaderClient에 user / profile 전달
 *
 * HeaderClient
 *   ↓
 * pathname 기반 active 메뉴 처리
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Today",
  },
  {
    href: "/explore",
    label: "Explore",
  },
  {
    href: "/collection",
    label: "Collection",
  },
  {
    href: "/observations",
    label: "Observations",
  },
];

export default function HeaderClient({ user, profile }) {
  const pathname = usePathname();

  const nickname = profile?.nickname || user?.email?.split("@")[0] || "Stargazer";

  /*
   * 프로필 이미지가 없다면
   * 닉네임 첫 글자를 Avatar에 표시
   */
  const initial = nickname.trim().charAt(0).toUpperCase();

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Logo */}
        <Link href="/" className="logo">
          <span className="logo-symbol">✦</span>
          AstroLog
        </Link>

        {/* Navigation */}
        <nav className="desktop-nav">
          {NAV_ITEMS.map(item => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        <div className="header-auth">
          {!user ? (
            <Link href="/login" className="login-link">
              로그인
            </Link>
          ) : (
            <div className="header-profile">
              <Link
                href="/observatory"
                className="header-avatar-link"
                aria-label={`${nickname} 프로필`}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="header-avatar-image" />
                ) : (
                  <span className="header-avatar">{initial}</span>
                )}
              </Link>

              <div className="header-profile-info">
                <span className="header-nickname">{nickname}</span>

                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
