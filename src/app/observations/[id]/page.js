import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

import DeleteObservationButton from "@/components/observations/DeleteObservationButton";
import SafeImage from "@/components/common/SafeImage";

const EQUIPMENT_LABELS = {
  naked_eye: "맨눈",
  binoculars: "쌍안경",
  telescope: "망원경",
  camera: "카메라",
};

export default async function ObservationDetailPage({ params }) {
  const { id } = await params;

  const user = await requireUser(`/observations/${id}`);

  const supabase = await createClient();

  const [observationResult, imagesResult] = await Promise.all([
    supabase
      .from("observations")
      .select(
        `
        id,
        user_id,
        observed_at,
        location_name,
        equipment,
        equipment_detail,
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
      .maybeSingle(),

    supabase
      .from("observation_images")
      .select("id, image_url, sort_order")
      .eq("observation_id", id)
      .order("sort_order"),
  ]);

  const observation = observationResult.data;

  if (observationResult.error || !observation) {
    if (observationResult.error) {
      console.error("관측 상세 조회 오류:", observationResult.error);
    }

    notFound();
  }

  if (imagesResult.error) {
    console.error("관측 이미지 조회 오류:", imagesResult.error);
  }

  const object = observation.celestial_objects;

  const images = await Promise.all(
    (imagesResult.data || []).map(async image => {
      if (!image.image_url) {
        return {
          ...image,
          signedUrl: "",
        };
      }

      const { data, error } = await supabase.storage
        .from("observation-images")
        .createSignedUrl(image.image_url, 60 * 60);

      if (error) {
        console.error("관측 이미지 URL 생성 오류:", error);
      }

      return {
        ...image,
        signedUrl: data?.signedUrl || "",
      };
    }),
  );

  const validImages = images.filter(image => Boolean(image.signedUrl));

  const equipmentLabel = EQUIPMENT_LABELS[observation.equipment] || observation.equipment || "-";

  const equipmentValue = observation.equipment_detail
    ? `${equipmentLabel} · ${observation.equipment_detail}`
    : equipmentLabel;

  return (
    <main className="observation-detail-page">
      <div className="container observation-detail-container">
        <Link href="/observations" className="object-back-button">
          ← Observations
        </Link>

        <section className="observation-detail-header">
          <span className="celestial-catalog">{object?.catalog_name}</span>

          <h1 className="display-en">
            {object?.name_en || object?.catalog_name || "Unknown Object"}
          </h1>

          <p>{object?.name_ko}</p>

          <div className="observation-detail-actions">
            <Link href={`/observations/${id}/edit`} className="button button-secondary">
              수정
            </Link>

            <DeleteObservationButton observationId={id} />
          </div>
        </section>

        {validImages.length > 0 && (
          <section className="observation-gallery-section">
            <div className="observation-gallery-heading">
              <span className="section-label">OBSERVATION PHOTOS</span>

              <span>{validImages.length}장의 기록</span>
            </div>

            <div
              className={`observation-gallery observation-gallery-${Math.min(
                validImages.length,
                3,
              )}`}
            >
              {validImages.map(image => (
                <div key={image.id} className="observation-gallery-item">
                  <SafeImage
                    src={image.signedUrl}
                    fallbackSrc="/images/home/hero.png"
                    alt="관측 당시 촬영한 사진"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {imagesResult.error && (
          <p className="data-inline-warning" role="status">
            관측 사진 일부를 불러오지 못했습니다.
          </p>
        )}

        <section className="observation-detail-grid">
          <div className="observation-detail-info">
            <InfoItem label="관측 일시" value={formatDateTime(observation.observed_at)} />

            <InfoItem label="관측 장소" value={observation.location_name || "-"} />

            <InfoItem label="관측 장비" value={equipmentValue} />

            <InfoItem
              label="관측 시간"
              value={
                observation.duration_minutes !== null ? `${observation.duration_minutes}분` : "-"
              }
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
