import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import DeleteObservationButton from "@/components/observations/DeleteObservationButton";

export default async function ObservationDetailPage({ params }) {
  const { id } = await params;

  const user = await requireUser(`/observations/${id}`);

  const supabase = await createClient();

  const { data: observation, error } = await supabase
    .from("observations")
    .select(
      `
      id,
      user_id,
      observed_at,
      location_name,
      equipment,
      rating,
      duration_minutes,
      note,
      created_at,
      celestial_objects (
        id,
        catalog_name,
        name_en,
        name_ko,
        type,
        distance,
        image_url,
        external_id
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !observation) {
    notFound();
  }

  const object = observation.celestial_objects;

  return (
    <main className="observation-detail-page">
      <div className="container observation-detail-container">
        <Link href="/observations" className="object-back-button">
          ← Observations
        </Link>

        <section className="observation-detail-header">
          <span className="celestial-catalog">{object?.catalog_name}</span>

          <h1 className="display-en">{object?.name_en}</h1>

          <p>{object?.name_ko}</p>

          <div className="observation-detail-actions">
            <Link href={`/observations/${id}/edit`} className="button button-secondary">
              수정
            </Link>

            <DeleteObservationButton observationId={id} />
          </div>
        </section>

        <section className="observation-detail-grid">
          <div className="observation-detail-info">
            <InfoItem label="관측 일시" value={formatDateTime(observation.observed_at)} />

            <InfoItem label="관측 장소" value={observation.location_name || "-"} />

            <InfoItem label="장비" value={observation.equipment || "-"} />

            <InfoItem
              label="관측 시간"
              value={observation.duration_minutes ? `${observation.duration_minutes}분` : "-"}
            />

            <InfoItem
              label="만족도"
              value={`${"★".repeat(observation.rating || 0)}${"☆".repeat(
                5 - (observation.rating || 0),
              )}`}
            />
          </div>

          <article className="observation-note-card">
            <span className="section-label">OBSERVATION NOTE</span>

            <p>{observation.note || "남겨진 관측 메모가 없습니다."}</p>
          </article>
        </section>
      </div>
    </main>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="observation-info-item">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
