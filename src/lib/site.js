export const SITE_NAME = "AstroLog";

export const SITE_DESCRIPTION =
  "오늘의 밤하늘을 탐색하고 천체를 관측하며 나만의 관측 기록과 천체 도감을 완성하는 천문 관측 서비스";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const DEFAULT_OG_IMAGE = "/images/home/hero.png";

export function createAbsoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${SITE_URL}${normalizedPath}`;
}
