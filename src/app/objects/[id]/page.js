import Link from "next/link";
import { notFound } from "next/navigation";

import FavoriteButton from "@/components/celestial/FavoriteButton";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS = {
  planet: "Planet",
  moon: "Planetary Satellite",
  star: "Star",
  cluster: "Star Cluster",
  nebula: "Nebula",
  galaxy: "Galaxy",
};

const COLLECTION_LABELS = {
  solar_system: "Solar System",
  messier: "Messier Objects",
  star: "Stars",
};

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",
  saturn: "/images/home/saturn.png",
  m31: "/images/home/m31.png",
};

/*
 * 현재는 천문 API 연결 전이므로
 * 고도 / 방위 / 관측 조건은 임시 UI 데이터.
 */
const OBSERVATION_MOCK = {
  altitude: "48°",
  direction: "NE",
  condition: "좋음",
};

export async function generateMetadata({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: object } = await supabase
    .from("celestial_objects")
    .select(
      `
      name_en,
      name_ko
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!object) {
    return {
      title: "Object | AstroLog",
    };
  }

  return {
    title: `${object.name_en || object.name_ko} | AstroLog`,

    description: object.name_ko
      ? `${object.name_ko} 천체 정보와 관측 기록을 확인해보세요.`
      : `${object.name_en} 천체 정보와 관측 기록을 확인해보세요.`,
  };
}

export default async function ObjectDetailPage({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  /*
   * =========================
   * 천체 정보
   * =========================
   */

  const { data: object, error: objectError } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (objectError || !object) {
    if (objectError) {
      console.error("천체 상세 조회 오류:", objectError);
    }

    notFound();
  }

  /*
   * =========================
   * 로그인 사용자
   * =========================
   *
   * 천체 상세 페이지 자체는
   * 비로그인 상태에서도 볼 수 있다.
   */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let observationCount = 0;

  let latestObservation = null;

  let latestObservationImage = null;

  let isFavorite = false;

  /*
   * =========================
   * 사용자 데이터
   * =========================
   */

  if (user) {
    /*
     * 관심 천체 여부와 관측 기록을
     * 서로 독립적으로 동시에 조회한다.
     */
    const [favoriteResult, observationsResult] = await Promise.all([
      supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("celestial_object_id", object.id)
        .maybeSingle(),

      supabase
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

              observation_images (
                id,
                image_url,
                sort_order
              )
            `,
          {
            count: "exact",
          },
        )
        .eq("user_id", user.id)
        .eq("celestial_object_id", object.id)
        .order("observed_at", {
          ascending: false,
        }),
    ]);

    /*
     * =========================
     * FAVORITE
     * =========================
     */

    if (favoriteResult.error) {
      console.error("관심 천체 조회 오류:", favoriteResult.error);
    } else {
      isFavorite = Boolean(favoriteResult.data);
    }

    /*
     * =========================
     * OBSERVATIONS
     * =========================
     */

    if (observationsResult.error) {
      console.error("천체별 관측 기록 조회 오류:", observationsResult.error);
    } else {
      observationCount = observationsResult.count || observationsResult.data?.length || 0;

      latestObservation = observationsResult.data?.[0] || null;
    }

    /*
     * 최근 관측 기록의 첫 번째 사진을
     * 미리보기로 사용.
     *
     * Storage bucket이 private이므로
     * signed URL 생성.
     */

    if (latestObservation?.observation_images?.length) {
      const sortedImages = [...latestObservation.observation_images].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
      );

      const representative = sortedImages[0];

      if (representative?.image_url) {
        const {
          data: signedUrlData,

          error: signedUrlError,
        } = await supabase.storage
          .from("observation-images")
          .createSignedUrl(representative.image_url, 60 * 60);

        if (signedUrlError) {
          console.error("최근 관측 사진 URL 생성 오류:", signedUrlError);
        }

        latestObservationImage = signedUrlData?.signedUrl || null;
      }
    }
  }

  /*
   * =========================
   * 화면 표시 값
   * =========================
   */

  const image = getObjectImage(object);

  const typeLabel = TYPE_LABELS[object.type] || object.type || "-";

  const collectionLabel =
    COLLECTION_LABELS[object.collection_group] || object.collection_group || "-";

  return (
    <main className="object-detail-page">
      {/* =========================
          HERO
      ========================= */}

      <section
        className="object-hero"
        style={{
          backgroundImage: `url("${image}")`,
        }}
      >
        <div className="object-hero-overlay" />

        <div className="container object-hero-inner">
          <Link href="/explore" className="object-back-button">
            ← 뒤로
          </Link>
        </div>
      </section>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <section className="object-main-section">
        <div className="container">
          <div className="object-main-grid">
            {/* =========================
                OBJECT INTRO
            ========================= */}

            <div className="object-main-content">
              <span className="object-catalog">{object.catalog_name || "CELESTIAL OBJECT"}</span>

              <h1 className="display-en object-main-title">{object.name_en}</h1>

              {object.name_ko && (
                <h2 className="heading-ko object-main-name-ko">{object.name_ko}</h2>
              )}

              <div className="object-main-tags">
                <span className="object-type-chip">{typeLabel}</span>

                {object.distance && <span className="object-distance">{object.distance}</span>}
              </div>

              {object.description && (
                <p className="object-main-description">{object.description}</p>
              )}
            </div>

            {/* =========================
                BASIC INFO
            ========================= */}

            <aside className="object-info-panel">
              <span className="object-info-heading">천체 기본 정보</span>

              <dl className="object-info-list">
                <div>
                  <dt>분류</dt>

                  <dd>{typeLabel}</dd>
                </div>

                <div>
                  <dt>컬렉션</dt>

                  <dd>{collectionLabel}</dd>
                </div>

                <div>
                  <dt>카탈로그</dt>

                  <dd>{object.catalog_name || "-"}</dd>
                </div>

                <div>
                  <dt>거리</dt>

                  <dd>{object.distance || "-"}</dd>
                </div>

                <div>
                  <dt>겉보기 등급</dt>

                  <dd>{object.magnitude ?? "-"}</dd>
                </div>
              </dl>
            </aside>
          </div>

          {/* =========================
              TODAY OBSERVATION
          ========================= */}

          <section className="object-observation-area">
            <p className="object-sub-label">오늘의 관측 정보</p>

            <div className="object-observation-grid">
              <div className="object-observation-card">
                <span>고도</span>

                <strong className="object-observation-value">{OBSERVATION_MOCK.altitude}</strong>
              </div>

              <div className="object-observation-card">
                <span>방위</span>

                <strong className="object-observation-value">{OBSERVATION_MOCK.direction}</strong>
              </div>

              <div className="object-observation-card">
                <span>등급</span>

                <strong className="object-observation-value">{object.magnitude ?? "-"}</strong>
              </div>

              <div className="object-observation-card">
                <span>관측 조건</span>

                <strong className="object-observation-value accent">
                  {OBSERVATION_MOCK.condition}
                </strong>
              </div>
            </div>

            <p className="object-observation-notice">
              고도, 방위, 관측 조건은 현재 UI 구현을 위한 임시 데이터이며 이후 천문 API와
              연결됩니다.
            </p>
          </section>

          {/* =========================
              MY OBSERVATION
          ========================= */}

          <PersonalObservation
            user={user}
            object={object}
            observationCount={observationCount}
            latestObservation={latestObservation}
            previewImage={latestObservationImage || image}
          />

          {/* =========================
              BOTTOM ACTIONS
          ========================= */}

          <div className="object-bottom-actions">
            <Link
              href={
                user
                  ? `/observations/new?object=${object.id}`
                  : `/login?next=${encodeURIComponent(`/observations/new?object=${object.id}`)}`
              }
              className="button button-primary object-record-button"
            >
              관측 기록하기
            </Link>

            <FavoriteButton
              userId={user?.id || null}
              objectId={object.id}
              initialFavorite={isFavorite}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/* ========================================
   PERSONAL OBSERVATION
======================================== */

function PersonalObservation({ user, object, observationCount, latestObservation, previewImage }) {
  /*
   * 비로그인
   */
  if (!user) {
    return (
      <section className="object-personal-card">
        <div className="object-personal-content">
          <span className="object-personal-label">나의 관측 기록</span>

          <strong className="object-unobserved">
            로그인하면 나의 관측 기록을 확인할 수 있습니다.
          </strong>

          <p>관측 기록을 남기고 나만의 천체 도감을 완성해보세요.</p>

          <Link
            href={`/login?next=${encodeURIComponent(`/objects/${object.id}`)}`}
            className="object-personal-login-link"
          >
            로그인하기 →
          </Link>
        </div>

        <div className="object-personal-preview">
          <img src={previewImage} alt={object.name_ko || object.name_en} />
        </div>
      </section>
    );
  }

  /*
   * 로그인했지만
   * 아직 관측하지 않은 천체
   */
  if (!latestObservation) {
    return (
      <section className="object-personal-card">
        <div className="object-personal-content">
          <span className="object-personal-label">나의 관측 기록</span>

          <strong className="object-unobserved">아직 관측하지 않은 천체입니다.</strong>

          <p>첫 관측 기록을 남기면 이 천체가 나의 천체 도감에 자동으로 추가됩니다.</p>
        </div>

        <div className="object-personal-preview">
          <img src={previewImage} alt={object.name_ko || object.name_en} />
        </div>
      </section>
    );
  }

  /*
   * 실제 관측 기록 존재
   */
  return (
    <section className="object-personal-card object-personal-card-observed">
      <div className="object-personal-content">
        <span className="object-personal-label">나의 관측 기록</span>

        <div className="object-personal-observed-heading">
          <strong>최근 관측</strong>

          <span>총 {observationCount}회</span>
        </div>

        <div className="object-personal-observation-meta">
          <span>{formatObservationDate(latestObservation.observed_at)}</span>

          {latestObservation.location_name && (
            <>
              <i />

              <span>{latestObservation.location_name}</span>
            </>
          )}
        </div>

        <div className="object-personal-rating">
          <span className="object-personal-stars">
            {"★".repeat(latestObservation.rating || 0)}

            {"☆".repeat(5 - (latestObservation.rating || 0))}
          </span>

          <span>
            {latestObservation.rating || 0}
            /5
          </span>
        </div>

        {latestObservation.note && (
          <p className="object-personal-note">“{truncate(latestObservation.note, 90)}”</p>
        )}

        <Link
          href={`/observations/${latestObservation.id}`}
          className="object-personal-detail-link"
        >
          최근 기록 보기 →
        </Link>
      </div>

      <Link
        href={`/observations/${latestObservation.id}`}
        className="object-personal-preview object-personal-preview-link"
      >
        <img src={previewImage} alt={`${object.name_ko || object.name_en} 최근 관측`} />
      </Link>
    </section>
  );
}

/* ========================================
   HELPERS
======================================== */

function getObjectImage(object) {
  return object.image_url || FALLBACK_IMAGES[object.external_id] || "/images/home/hero.png";
}

function formatObservationDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",

    hour: "2-digit",
    minute: "2-digit",

    hour12: false,
  }).format(new Date(value));
}

function truncate(text, maxLength) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}…`;
}
