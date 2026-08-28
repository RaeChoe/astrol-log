import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import ObservationForm from "@/components/observations/ObservationForm";

export const metadata = {
  title: "관측 기록 수정 | AstroLog",
};

export default async function EditObservationPage({ params }) {
  const { id } = await params;

  const user = await requireUser(`/observations/${id}/edit`);

  const supabase = await createClient();

  const [observationResult, objectsResult] = await Promise.all([
    supabase.from("observations").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),

    supabase
      .from("celestial_objects")
      .select("id, catalog_name, name_en, name_ko")
      .order("name_en"),
  ]);

  const observation = observationResult.data;

  if (observationResult.error || !observation) {
    notFound();
  }

  return (
    <main className="observation-editor-page">
      <div className="container observation-editor-container">
        <Link href={`/observations/${id}`} className="object-back-button">
          ← 관측 기록
        </Link>

        <div className="observation-editor-header">
          <span className="section-label">EDIT OBSERVATION</span>

          <h1 className="heading-ko">관측 기록 수정</h1>

          <p>그날의 기록을 다시 정리해보세요.</p>
        </div>

        <ObservationForm
          userId={user.id}
          objects={objectsResult.data || []}
          initialData={observation}
        />
      </div>
    </main>
  );
}
