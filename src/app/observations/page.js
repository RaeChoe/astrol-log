import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import ObservationsClient from "@/components/observations/ObservationsClient";

export const metadata = {
  title: "관측 기록 | AstroLog",
};

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",
  saturn: "/images/home/saturn.png",
  m31: "/images/home/m31.png",
};

export default async function ObservationsPage() {
  const user = await requireUser("/observations");

  const supabase = await createClient();

  /*
   * 현재 사용자의 관측 기록
   *
   * celestial_objects
   * → 카드의 천체 정보
   *
   * observation_images
   * → 대표 관측 사진 / 사진 수
   */
  const { data: observations, error } = await supabase
    .from("observations")
    .select(
      `
      id,
      observed_at,
      location_name,
      equipment,
      equipment_detail,
      rating,
      duration_minutes,
      note,

      celestial_objects (
        id,
        catalog_name,
        name_en,
        name_ko,
        type,
        image_url,
        external_id
      ),

      observation_images (
        id,
        image_url,
        sort_order
      )
    `,
    )
    .eq("user_id", user.id)
    .order("observed_at", {
      ascending: false,
    });

  if (error) {
    console.error("관측 기록 조회 오류:", error);
  }

  /*
   * private Storage 이미지는
   * 직접 URL을 사용할 수 없으므로
   * 대표 이미지에 signed URL 생성.
   */
  const records = await Promise.all(
    (observations || []).map(async observation => {
      const sortedImages = [...(observation.observation_images || [])].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
      );

      const representative = sortedImages[0];

      let observationImage = null;

      if (representative?.image_url) {
        const { data, error: signedUrlError } = await supabase.storage
          .from("observation-images")
          .createSignedUrl(representative.image_url, 60 * 60);

        if (signedUrlError) {
          console.error("관측 대표 이미지 URL 생성 오류:", signedUrlError);
        }

        observationImage = data?.signedUrl || null;
      }

      return {
        ...observation,

        imageCount: sortedImages.length,

        /*
         * 실제 관측 사진이 있으면 우선 사용.
         * 없으면 celestial object 이미지 사용.
         */
        thumbnail: observationImage || getObjectImage(observation.celestial_objects),

        hasObservationPhoto: Boolean(observationImage),
      };
    }),
  );

  return <ObservationsClient observations={records} />;
}

function getObjectImage(object) {
  return object?.image_url || FALLBACK_IMAGES[object?.external_id] || "/images/home/hero.png";
}
