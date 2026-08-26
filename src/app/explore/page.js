import { createClient } from "@/lib/supabase/server";
import ExploreClient from "@/components/celestial/ExploreClient";

export const metadata = {
  title: "Explore | AstroLog",
  description: "밤하늘의 천체들을 탐색해보세요.",
};

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data: objects, error } = await supabase
    .from("celestial_objects")
    .select(
      `
      id,
      catalog_name,
      name_en,
      name_ko,
      type,
      collection_group,
      distance,
      magnitude,
      image_url,
      external_id
    `,
    )
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="explore-page">
        <div className="container explore-error">
          <h1 className="display-en">Explore the night sky.</h1>
          <p>천체 정보를 불러오지 못했습니다.</p>
        </div>
      </main>
    );
  }

  return <ExploreClient objects={objects ?? []} />;
}
