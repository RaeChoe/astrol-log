import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-symbol">✦</span>
          AstroLog
        </Link>

        <nav className="desktop-nav">
          <Link href="/">Today</Link>
          <Link href="/explore">Explore</Link>
          <Link href="/collection">Collection</Link>
          <Link href="/observations">Observations</Link>
        </nav>

        <Link href="/login" className="login-link">
          로그인
        </Link>
      </div>
    </header>
  );
}
