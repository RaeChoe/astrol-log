import { createClient } from "@/lib/supabase/server";
import ExploreClient from "@/components/celestial/ExploreClient";

export const metadata = {
  title: "Explore | AstroLog",
};

export default async function ExplorePage() {
  const supabase = await createClient();

  /*
   * Explore는 비로그인 사용자도 접근 가능.
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

  let observedObjectIds = [];
  let favoriteObjectIds = [];

  /*
   * 로그인한 사용자라면
   * 관측 상태와 관심 천체를 동시에 조회.
   */
  if (user) {
    const [observationsResult, favoritesResult] = await Promise.all([
      supabase.from("observations").select("celestial_object_id").eq("user_id", user.id),

      supabase.from("favorites").select("celestial_object_id").eq("user_id", user.id),
    ]);

    if (observationsResult.error) {
      console.error("Explore 관측 상태 조회 오류:", observationsResult.error);
    } else {
      observedObjectIds = [
        ...new Set(
          (observationsResult.data || []).map(observation => observation.celestial_object_id),
        ),
      ];
    }

    if (favoritesResult.error) {
      console.error("Explore 관심 천체 조회 오류:", favoritesResult.error);
    } else {
      favoriteObjectIds = [
        ...new Set((favoritesResult.data || []).map(favorite => favorite.celestial_object_id)),
      ];
    }
  }

  return (
    <ExploreClient
      objects={objects || []}
      observedObjectIds={observedObjectIds}
      favoriteObjectIds={favoriteObjectIds}
      isLoggedIn={Boolean(user)}
    />
  );
}
