import { createClient } from "@/lib/supabase/server";
import ExploreClient from "@/components/celestial/ExploreClient";

export const metadata = {
  title: "Explore | AstroLog",
};

export default async function ExplorePage() {
  const supabase = await createClient();

  /*
   * Explore는 로그인하지 않아도 볼 수 있는 페이지.
   * 로그인 사용자인 경우에만 관측 상태를 추가한다.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * 전체 천체 조회
   */
  const { data: objects, error: objectsError } = await supabase
    .from("celestial_objects")
    .select(
      `
      id,
      catalog_name,
      name_en,
      name_ko,
      type,
      collection_group,
      description,
      distance,
      magnitude,
      image_url,
      external_id
    `,
    )
    .order("id");

  if (objectsError) {
    console.error("Explore 천체 조회 오류:", objectsError);
  }

  /*
   * 로그인 사용자라면
   * 어떤 천체를 관측했는지 조회
   */
  let observedObjectIds = [];

  if (user) {
    const { data: observations, error: observationsError } = await supabase
      .from("observations")
      .select("celestial_object_id")
      .eq("user_id", user.id);

    if (observationsError) {
      console.error("Explore 관측 상태 조회 오류:", observationsError);
    } else {
      /*
       * 같은 천체를 여러 번 관측해도
       * Explore에서는 한 번만 관측 완료 처리.
       */
      observedObjectIds = [
        ...new Set((observations || []).map(observation => observation.celestial_object_id)),
      ];
    }
  }

  return (
    <ExploreClient
      objects={objects || []}
      observedObjectIds={observedObjectIds}
      isLoggedIn={Boolean(user)}
    />
  );
}
