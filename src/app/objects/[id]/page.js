import Link from "next/link";

import { notFound } from "next/navigation";

import FavoriteButton from "@/components/celestial/FavoriteButton";
import SafeImage from "@/components/common/SafeImage";

import { createClient } from "@/lib/supabase/server";

import { getObserverLocation } from "@/lib/location";

import { getTodaySkyData } from "@/lib/astronomy/today";

import { getCurrentObjectObservation } from "@/lib/astronomy/highlights";

import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/site";

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

/* ========================================
   DYNAMIC SEO
======================================== */

export async function generateMetadata({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: object,

    error,
  } = await supabase
    .from("celestial_objects")
    .select(
      `
        id,
        catalog_name,
        name_en,
        name_ko,
        type,
        description,
        image_url,
        external_id
      `,
    )
    .eq("id", id)
    .maybeSingle();

  /*
   * DB 오류나 존재하지 않는 ID.
   *
   * 검색엔진에 잘못된 Object 페이지가
   * 색인되는 것을 막는다.
   */
  if (error || !object) {
    return {
      title: "천체를 찾을 수 없습니다",

      description: "요청한 천체 정보를 찾을 수 없습니다.",

      robots: {
        index: false,

        follow: false,
      },
    };
  }

  const displayName = object.name_ko || object.name_en || object.catalog_name || "천체";

  const englishName = object.name_en || object.catalog_name || displayName;

  const typeLabel = TYPE_LABELS[object.type] || "Celestial Object";

  /*
   * DB description이 있으면
   * 검색결과 설명에도 활용.
   *
   * 너무 긴 설명은 잘라낸다.
   */
  const description = createMetadataDescription(object, displayName);

  /*
   * celestial_objects.image_url은 현재
   *
   * /images/celestial/detail/moon.webp
   *
   * 같은 형태이므로 metadataBase와
   * 결합되어 절대 URL이 된다.
   */
  const image =
    object.image_url ||
    (object.external_id ? `/images/celestial/detail/${object.external_id}.webp` : DEFAULT_OG_IMAGE);

  const canonical = `/objects/${object.id}`;

  return {
    /*
     * RootLayout의 template으로 인해
     *
     * Moon | AstroLog
     *
     * 형태가 된다.
     */
    title: englishName,

    description,

    alternates: {
      canonical,
    },

    openGraph: {
      type: "article",

      locale: "ko_KR",

      url: canonical,

      siteName: SITE_NAME,

      title: `${englishName} · ${displayName}`,

      description,

      images: [
        {
          url: image,

          alt: `${displayName} 천체 이미지`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title: `${englishName} · ${displayName}`,

      description,

      images: [image],
    },

    other: {
      "object:type": typeLabel,

      "object:catalog": object.catalog_name || "",
    },
  };
}

/* ========================================
   OBJECT DETAIL
======================================== */

export default async function ObjectDetailPage({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  /*
   * =========================
   * CELESTIAL OBJECT
   * =========================
   */

  const {
    data: object,

    error: objectError,
  } = await supabase
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
   * CURRENT LOCATION
   * =========================
   */

  const location = await getObserverLocation();

  /*
   * =========================
   * CURRENT SKY
   * =========================
   */

  const now = new Date();

  const [sky, currentObservation] = await Promise.all([
    getTodaySkyData(location),

    Promise.resolve(
      getCurrentObjectObservation({
        externalId: object.external_id,

        latitude: location.latitude,

        longitude: location.longitude,

        now,
      }),
    ),
  ]);

  const currentCondition = getCurrentObservationCondition({
    observation: currentObservation,

    weatherCondition: sky.observationCondition,
  });

  /*
   * =========================
   * USER
   * =========================
   */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let observationCount = 0;

  let latestObservation = null;

  let latestObservationImage = null;

  let isFavorite = false;

  let favoriteLoadError = false;

  let observationsLoadError = false;

  /*
   * =========================
   * USER DATA
   * =========================
   */

  if (user) {
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

    if (favoriteResult.error) {
      console.error("관심 천체 조회 오류:", favoriteResult.error);

      favoriteLoadError = true;
    } else {
      isFavorite = Boolean(favoriteResult.data);
    }

    if (observationsResult.error) {
      console.error("천체별 관측 기록 조회 오류:", observationsResult.error);

      observationsLoadError = true;
    } else {
      observationCount = observationsResult.count || observationsResult.data?.length || 0;

      latestObservation = observationsResult.data?.[0] || null;
    }

    /*
     * 최근 관측 사진
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
        } = await supabase.storage.from("observation-images").createSignedUrl(
          representative.image_url,

          60 * 60,
        );

        if (signedUrlError) {
          console.error("최근 관측 사진 URL 생성 오류:", signedUrlError);
        }

        latestObservationImage = signedUrlData?.signedUrl || null;
      }
    }
  }

  /*
   * =========================
   * DISPLAY VALUES
   * =========================
   */

  const image = getObjectImage(object);

  const typeLabel = TYPE_LABELS[object.type] || object.type || "-";

  const collectionLabel =
    COLLECTION_LABELS[object.collection_group] || object.collection_group || "-";

  const observationLocationLabel = location.source === "geolocation" ? "현재 위치" : "서울";

  return (
    <main className="object-detail-page">
      {/* HERO */}

      <section className="object-hero">
        <SafeImage
          src={image}
          fallbackSrc="/images/home/hero.png"
          alt=""
          className="object-hero-image"
          aria-hidden="true"
        />

        <div className="object-hero-overlay" />

        <div className="container object-hero-inner">
          <Link href="/explore" className="object-back-button">
            ← 뒤로
          </Link>
        </div>
      </section>

      {/* MAIN CONTENT */}

      <section className="object-main-section">
        <div className="container">
          <div className="object-main-grid">
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

          {/* TODAY OBSERVATION */}

          <section className="object-observation-area">
            <p className="object-sub-label">오늘의 관측 정보</p>

            <div className="object-observation-grid">
              <div className="object-observation-card">
                <span>현재 고도</span>

                <strong className="object-observation-value">
                  {currentObservation?.altitudeLabel || "-"}
                </strong>
              </div>

              <div className="object-observation-card">
                <span>현재 방위</span>

                <strong className="object-observation-value">
                  {currentObservation?.direction || "-"}
                </strong>

                {currentObservation && (
                  <small className="object-observation-detail">
                    {currentObservation.azimuthLabel}
                  </small>
                )}
              </div>

              <div className="object-observation-card">
                <span>등급</span>

                <strong className="object-observation-value">{object.magnitude ?? "-"}</strong>
              </div>

              <div className="object-observation-card">
                <span>현재 관측 조건</span>

                <strong
                  className={`object-observation-value ${currentCondition.accent ? "accent" : ""}`}
                >
                  {currentCondition.label}
                </strong>
              </div>
            </div>

            <p className="object-observation-notice">
              {observationLocationLabel} 기준 현재 시각의 천체 위치와 기상청 기상 정보를 바탕으로
              계산한 값입니다.
            </p>
          </section>

          {/* MY OBSERVATION */}

          <PersonalObservation
            user={user}
            object={object}
            observationCount={observationCount}
            latestObservation={latestObservation}
            previewImage={latestObservationImage || image}
            loadError={observationsLoadError}
          />

          {/* BOTTOM ACTIONS */}

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
              initialLoadError={favoriteLoadError}
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

function PersonalObservation({
  user,
  object,
  observationCount,
  latestObservation,
  previewImage,
  loadError = false,
}) {
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
          <SafeImage
            src={previewImage}
            fallbackSrc="/images/home/hero.png"
            alt={object.name_ko || object.name_en || "천체 이미지"}
          />
        </div>
      </section>
    );
  }

  /*
   * 관측 기록 조회 실패
   */

  if (loadError) {
    return (
      <section className="object-personal-card">
        <div className="object-personal-content">
          <span className="object-personal-label">나의 관측 기록</span>

          <strong className="object-unobserved">관측 기록을 불러오지 못했습니다.</strong>

          <p>일시적인 문제일 수 있습니다. 페이지를 새로고침한 뒤 다시 확인해주세요.</p>
        </div>

        <div className="object-personal-preview">
          <SafeImage
            src={previewImage}
            fallbackSrc="/images/home/hero.png"
            alt={object.name_ko || object.name_en || "천체 이미지"}
          />
        </div>
      </section>
    );
  }

  /*
   * 미관측
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
          <SafeImage
            src={previewImage}
            fallbackSrc="/images/home/hero.png"
            alt={object.name_ko || object.name_en || "천체 이미지"}
          />
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
        <SafeImage
          src={previewImage}
          fallbackSrc="/images/home/hero.png"
          alt={`${object.name_ko || object.name_en} 최근 관측`}
        />
      </Link>
    </section>
  );
}

/* ========================================
   CURRENT OBSERVATION CONDITION
======================================== */

function getCurrentObservationCondition({ observation, weatherCondition }) {
  if (!observation) {
    return {
      label: "정보 없음",

      accent: false,
    };
  }

  if (observation.altitude <= 0) {
    return {
      label: "관측 불가",

      accent: false,
    };
  }

  if (observation.sunAltitude > -6) {
    return {
      label: "관측 시간 전",

      accent: false,
    };
  }

  if (observation.altitude < 20) {
    return {
      label: "낮은 고도",

      accent: false,
    };
  }

  const score = weatherCondition?.score ?? 0;

  if (!score) {
    return {
      label: "정보 없음",

      accent: false,
    };
  }

  return {
    label: weatherCondition.label,

    accent: score >= 4,
  };
}

/* ========================================
   SEO HELPERS
======================================== */

function createMetadataDescription(object, displayName) {
  const source = object.description?.trim();

  if (source) {
    return truncateMetadata(source, 150);
  }

  const catalog = object.catalog_name ? ` (${object.catalog_name})` : "";

  return `${displayName}${catalog}의 천체 정보와 오늘의 관측 조건, 관측 기록을 AstroLog에서 확인해보세요.`;
}

function truncateMetadata(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
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

    timeZone: "Asia/Seoul",
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
