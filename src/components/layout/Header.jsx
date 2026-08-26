"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Today" },
    { href: "/explore", label: "Explore" },
    { href: "/collection", label: "Collection" },
    { href: "/observations", label: "Observations" },
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-symbol">✦</span>
          AstroLog
        </Link>

        <nav className="desktop-nav">
          {navItems.map(item => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/login" className="login-link">
          로그인
        </Link>
      </div>
    </header>
  );
}
