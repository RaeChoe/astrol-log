import { createClient } from "@/lib/supabase/server";

import { SITE_URL } from "@/lib/site";

export default async function sitemap() {
  const now = new Date();

  /*
   * 로그인 없이 접근 가능한
   * 공개 페이지.
   *
   * Collection / Observations /
   * Observatory / Login / Signup은
   * sitemap에서 제외.
   */
  const staticPages = [
    {
      url: SITE_URL,

      lastModified: now,

      changeFrequency: "daily",

      priority: 1,
    },

    {
      url: `${SITE_URL}/explore`,

      lastModified: now,

      changeFrequency: "weekly",

      priority: 0.9,
    },
  ];

  try {
    const supabase = await createClient();

    /*
     * 실제 DB의 천체 목록을 가져와
     * /objects/[id] sitemap 생성.
     */
    const {
      data: objects,

      error,
    } = await supabase
      .from("celestial_objects")
      .select(
        `
          id,
          updated_at
        `,
      )
      .order("id");

    if (error) {
      console.error("Sitemap 천체 조회 오류:", error);

      return staticPages;
    }

    const objectPages = (objects || []).map(object => ({
      url: `${SITE_URL}/objects/${object.id}`,

      lastModified: object.updated_at ? new Date(object.updated_at) : now,

      changeFrequency: "monthly",

      priority: 0.8,
    }));

    return [...staticPages, ...objectPages];
  } catch (error) {
    /*
     * Supabase가 잠시 실패해도
     * sitemap 자체가 500이 되지 않게
     * 공개 정적 페이지는 유지.
     */
    console.error("Sitemap 생성 오류:", error);

    return staticPages;
  }
}
