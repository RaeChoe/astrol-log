import { Playfair_Display, Noto_Serif_KR } from "next/font/google";

import Header from "@/components/layout/Header";
import LocationInitializer from "@/components/common/LocationInitializer";

import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-kr",
});

export const metadata = {
  /*
   * 상대 경로 OG 이미지 / canonical URL을
   * 절대 URL로 변환하기 위한 기준 주소.
   */
  metadataBase: new URL(SITE_URL),

  /*
   * 각 페이지에서 title만 지정하면
   *
   * Explore | AstroLog
   * Mars | AstroLog
   *
   * 형태로 자동 적용.
   */
  title: {
    default: SITE_NAME,

    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,

  keywords: [
    "천문",
    "천체",
    "별 관측",
    "밤하늘",
    "천문 관측",
    "관측 기록",
    "천체 도감",
    "별자리",
    "행성",
    "AstroLog",
  ],

  authors: [
    {
      name: SITE_NAME,
    },
  ],

  creator: SITE_NAME,

  publisher: SITE_NAME,

  category: "astronomy",

  /*
   * 기본 검색엔진 설정.
   * 로그인 여부와 무관한 공개 페이지에 적용.
   */
  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,

      "max-image-preview": "large",

      "max-snippet": -1,

      "max-video-preview": -1,
    },
  },

  /*
   * 기본 Open Graph.
   *
   * 개별 천체 상세에서는
   * 해당 천체 이미지로 다시 덮어씀.
   */
  openGraph: {
    type: "website",

    locale: "ko_KR",

    url: "/",

    siteName: SITE_NAME,

    title: SITE_NAME,

    description: SITE_DESCRIPTION,

    images: [
      {
        url: DEFAULT_OG_IMAGE,

        width: 1200,

        height: 630,

        alt: "AstroLog - 오늘의 밤하늘과 천문 관측 기록",
      },
    ],
  },

  /*
   * 카카오톡 이외에도
   * X/Twitter 계열 미리보기 대응.
   */
  twitter: {
    card: "summary_large_image",

    title: SITE_NAME,

    description: SITE_DESCRIPTION,

    images: [DEFAULT_OG_IMAGE],
  },

  /*
   * 홈 canonical
   */
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`${playfair.variable} ${notoSerifKR.variable}`}>
        <LocationInitializer />

        <Header />

        {children}
      </body>
    </html>
  );
}
