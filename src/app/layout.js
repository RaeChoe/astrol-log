import { Playfair_Display, Noto_Serif_KR } from "next/font/google";

import Header from "@/components/layout/Header";
import LocationInitializer from "@/components/common/LocationInitializer";

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
  title: "AstroLog",
  description: "오늘의 밤하늘을 탐색하고 관측 기록을 남기는 천문 관측 서비스",
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
