import { SITE_URL } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",

        allow: ["/", "/explore", "/objects/"],

        /*
         * 사용자 개인 데이터나
         * 인증 관련 페이지는
         * 검색엔진 수집 대상에서 제외.
         */
        disallow: [
          "/login",
          "/signup",
          "/collection",
          "/observations",
          "/observatory",
          "/auth/",
          "/api/",
        ],
      },
    ],

    sitemap: `${SITE_URL}/sitemap.xml`,

    host: SITE_URL,
  };
}
