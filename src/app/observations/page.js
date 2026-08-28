import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Observations | AstroLog",
};

export default async function ObservationsPage() {
  const user = await requireUser("/observations");

  const supabase = await createClient();

  const { data: observations, error } = await supabase
    .from("observations")
    .select(
      `
      id,
      observed_at,
      location_name,
      equipment,
      rating,
      duration_minutes,
      note,
      celestial_object_id,
      celestial_objects (
        id,
        catalog_name,
        name_en,
        name_ko,
        image_url,
        external_id
      )
    `,
    )
    .eq("user_id", user.id)
    .order("observed_at", { ascending: false });

  if (error) {
    console.error("관측 기록 조회 오류:", error);
  }

  return (
    <main className="observations-page">
      <section className="container observations-header">
        <div>
          <span className="section-label">OBSERVATION LOG</span>

          <h1 className="display-en">Observations</h1>

          <p>밤하늘에서 만난 순간들을 다시 돌아보세요.</p>
        </div>

        <Link href="/observations/new" className="button button-primary">
          + 새 관측 기록
        </Link>
      </section>

      <section className="container observations-content">
        {!observations?.length ? (
          <div className="observations-empty">
            <span>✦</span>

            <h2>아직 관측 기록이 없습니다</h2>

            <p>첫 번째 밤하늘의 순간을 기록해보세요.</p>

            <Link href="/observations/new" className="button button-primary">
              첫 관측 기록하기
            </Link>
          </div>
        ) : (
          <div className="observation-list">
            {observations.map(observation => {
              const object = observation.celestial_objects;

              return (
                <Link
                  key={observation.id}
                  href={`/observations/${observation.id}`}
                  className="observation-list-card"
                >
                  <div className="observation-list-date">
                    <strong>{formatDate(observation.observed_at)}</strong>

                    <span>{formatTime(observation.observed_at)}</span>
                  </div>

                  <div className="observation-list-main">
                    <span className="celestial-catalog">
                      {object?.catalog_name || "CELESTIAL OBJECT"}
                    </span>

                    <h2>{object?.name_en || "Unknown Object"}</h2>

                    <p>{object?.name_ko}</p>
                  </div>

                  <div className="observation-list-meta">
                    {observation.location_name && <span>◇ {observation.location_name}</span>}

                    <span className="observation-list-rating">
                      {"★".repeat(observation.rating || 0)}

                      {"☆".repeat(5 - (observation.rating || 0))}
                    </span>
                  </div>

                  <span className="observation-list-arrow">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
