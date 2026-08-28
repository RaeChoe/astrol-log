import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import ObservationForm from "@/components/observations/ObservationForm";

export const metadata = {
  title: "관측 기록하기 | AstroLog",
};

export default async function NewObservationPage({ searchParams }) {
  const params = await searchParams;

  const objectId = params?.object || "";

  const nextPath = objectId ? `/observations/new?object=${objectId}` : "/observations/new";

  const user = await requireUser(nextPath);

  const supabase = await createClient();

  const { data: objects, error } = await supabase
    .from("celestial_objects")
    .select("id, catalog_name, name_en, name_ko")
    .order("name_en");

  if (error) {
    console.error("천체 목록 조회 오류:", error);
  }

  const initialData = objectId
    ? {
        celestial_object_id: objectId,
      }
    : null;

  return (
    <main className="observation-editor-page">
      <div className="container observation-editor-container">
        <Link href="/observations" className="object-back-button">
          ← 관측 기록
        </Link>

        <div className="observation-editor-header">
          <span className="section-label">NEW OBSERVATION</span>

          <h1 className="heading-ko">오늘의 밤을 기록하세요</h1>

          <p>관측한 천체와 그 순간의 기억을 남겨보세요.</p>
        </div>

        <ObservationForm userId={user.id} objects={objects || []} initialData={initialData} />
      </div>
    </main>
  );
}
