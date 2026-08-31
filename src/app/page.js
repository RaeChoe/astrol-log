import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { getObserverLocation } from "@/lib/location";

import { getTodaySkyData } from "@/lib/astronomy/today";

import { getTonightHighlights } from "@/lib/astronomy/highlights";

import { getCelestialThumbnail } from "@/lib/celestial/images";

function Rating({ value }) {
  return (
    <div className="highlight-rating" aria-label={`관측 추천 ${value}점`}>
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <span key={index} className={index < value ? "star active" : "star"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();

  /*
   * =========================
   * CURRENT LOCATION
   * =========================
   *
   * 위치 권한 허용:
   * → 브라우저 geolocation 좌표
   *
   * 위치가 없거나 거부:
   * → 서울 fallback
   */

  const location = await getObserverLocation();

  /*
   * =========================
   * TODAY SKY
   * =========================
   */

  const sky = await getTodaySkyData(location);

  /*
   * =========================
   * ALL CELESTIAL OBJECTS
   * =========================
   */

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
      magnitude,
      image_url,
      external_id
    `,
    )
    .order("catalog_name", {
      ascending: true,
    });

  /*
   * =========================
   * TONIGHT'S HIGHLIGHTS
   * =========================
   *
   * 이제 서울 고정이 아니라
   * 현재 사용자 위치 기준.
   */

  const highlights = error
    ? []
    : getTonightHighlights({
        objects: objects || [],

        latitude: location.latitude,

        longitude: location.longitude,

        moonIllumination: sky.moonIllumination,
      });

  /*
   * =========================
   * SKY SUMMARY
   * =========================
   */

  const observationInfo = [
    {
      label: "달 위상",

      value: sky.moonPhase,

      sub: `${sky.moonIllumination}%`,

      icon: "◐",
    },

    {
      label: "일몰",

      value: sky.sunset,

      sub: "KST",

      icon: "◒",
    },

    {
      label: "월출",

      value: sky.moonrise,

      sub: "KST",

      icon: "○",
    },

    {
      label: "관측 적합도",

      value: sky.observationCondition.label,

      sub: sky.observationCondition.score ? `${sky.observationCondition.score}/5` : "-",

      icon: "◉",
    },

    {
      label: "추천 시간",

      value: sky.recommendation.available ? sky.recommendation.start : sky.recommendation.label,

      sub: sky.recommendation.available ? `— ${sky.recommendation.end}` : "기상 조건 기준",

      icon: "◇",
    },
  ];

  const locationLabel = location.source === "geolocation" ? "CURRENT LOCATION" : "SEOUL, KOREA";

  return (
    <main className="today-page">
      {/* =========================
          HERO
      ========================= */}

      <section className="today-hero">
        <div className="today-hero-overlay" />

        <div className="container today-hero-inner">
          <div className="today-hero-content">
            <p className="today-eyebrow">GOOD EVENING · {locationLabel}</p>

            <h1 className="heading-ko today-title">
              <span>오늘 밤,</span>

              <span>무엇을 볼까요?</span>
            </h1>

            <div className="today-meta">
              <span>{sky.date}</span>

              <span>{sky.condition}</span>

              <span>{sky.temperature !== null ? `${Math.round(sky.temperature)}°C` : "-"}</span>

              <span>습도 {sky.humidity !== null ? `${Math.round(sky.humidity)}%` : "-"}</span>
            </div>

            <div className="today-actions">
              <Link href="/explore" className="button button-primary">
                밤하늘 탐색하기
              </Link>

              <Link href="/observations/new" className="button button-secondary">
                관측 기록하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          SKY SUMMARY
      ========================= */}

      <section className="sky-summary-section">
        <div className="container">
          <div className="sky-summary">
            {observationInfo.map(item => (
              <div className="sky-summary-item" key={item.label}>
                <span className="sky-summary-icon">{item.icon}</span>

                <span className="sky-summary-label">{item.label}</span>

                <strong className="sky-summary-value">{item.value}</strong>

                <span className="sky-summary-sub">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          HIGHLIGHTS
      ========================= */}

      <section className="today-section">
        <div className="container">
          <div className="section-label">오늘 밤</div>

          <div className="today-section-heading">
            <div>
              <h2 className="display-en">Tonight&apos;s Highlights</h2>

              {sky.observationCondition.score <= 2 && (
                <p className="highlight-weather-notice">
                  현재 기상 조건은 좋지 않지만, 천문 조건 기준 오늘 밤 주목할 천체입니다.
                </p>
              )}
            </div>

            <Link href="/explore" className="section-link">
              모두 탐색하기 →
            </Link>
          </div>

          {error ? (
            <p className="section-error">천체 정보를 불러오지 못했습니다.</p>
          ) : highlights.length ? (
            <div className="highlight-grid">
              {highlights.map(object => (
                <Link href={`/objects/${object.id}`} key={object.id} className="highlight-card">
                  <div className="highlight-image-wrapper">
                    <img
                      src={getCelestialThumbnail(object)}
                      alt={object.name_ko}
                      className="highlight-image"
                    />

                    <span className="highlight-badge">{object.typeLabel}</span>
                  </div>

                  <div className="highlight-content">
                    <h3 className="display-en">{object.catalog_name || object.name_en}</h3>

                    <p>{object.name_ko}</p>

                    <div className="highlight-footer">
                      <Rating value={object.rating} />

                      <span className="highlight-time">{object.timeLabel}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="section-error">오늘 밤 관측 가능한 추천 천체가 없습니다.</p>
          )}
        </div>
      </section>

      {/* =========================
          WEEKLY EVENT
      ========================= */}

      <section className="today-section event-section">
        <div className="container">
          <div className="section-label">이번 주</div>

          <h2 className="heading-ko event-section-title">주요 천문 이벤트</h2>

          {/*
           * 아직 남아 있는 mock.
           * 다음 단계에서 실제화 예정.
           */}
          <article className="event-card">
            <div className="event-content">
              <span className="event-date">8월 28일 · 04:00</span>

              <h3 className="heading-ko">토성 충</h3>

              <span className="event-name">SATURN OPPOSITION</span>

              <p>
                토성이 지구와 가장 가까워지는 시기입니다. 망원경 없이도 고리가 선명하게 관측되는
                시기예요.
              </p>
            </div>

            <div className="event-visual" aria-hidden="true" />
          </article>
        </div>
      </section>
    </main>
  );
}
