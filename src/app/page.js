import Link from "next/link";

import LocationControl from "@/components/common/LocationControl";

import { createClient } from "@/lib/supabase/server";

import { getObserverLocation } from "@/lib/location";

import { getTodaySkyData } from "@/lib/astronomy/today";

import { getTonightHighlights } from "@/lib/astronomy/highlights";

import { getWeeklyAstronomyEvents, formatAstronomyEventDate } from "@/lib/astronomy/events";

import { getCelestialThumbnail } from "@/lib/celestial/images";

/* ========================================
   RATING
======================================== */

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

/* ========================================
   HOME
======================================== */

export default async function HomePage() {
  const supabase = await createClient();

  /* ========================================
     CURRENT LOCATION
  ======================================== */

  const location = await getObserverLocation();

  /* ========================================
     TODAY SKY
  ======================================== */

  const sky = await getTodaySkyData(location);

  /* ========================================
     CELESTIAL OBJECTS
  ======================================== */

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

  /* ========================================
     TONIGHT'S HIGHLIGHTS
  ======================================== */

  const highlights = error
    ? []
    : getTonightHighlights({
        objects: objects || [],

        latitude: location.latitude,

        longitude: location.longitude,

        moonIllumination: sky.moonIllumination,
      });

  /* ========================================
     WEEKLY EVENTS
  ======================================== */

  const weeklyEvents = getWeeklyAstronomyEvents({
    now: new Date(),

    latitude: location.latitude,

    longitude: location.longitude,

    rangeDays: 7,
  });

  const mainEvent = weeklyEvents[0] || null;

  const secondaryEvents = weeklyEvents.slice(1, 3);

  const moreEvents = weeklyEvents.slice(3);

  const mainEventImage = getEventVisualImage(mainEvent);

  /* ========================================
     SKY SUMMARY
  ======================================== */

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

  return (
    <main className="today-page">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="today-hero">
        <div className="today-hero-overlay" />

        <div className="container today-hero-inner">
          <div className="today-hero-content">
            <div className="today-location-row">
              <p className="today-eyebrow">GOOD EVENING</p>

              <LocationControl isUsingCurrentLocation={location.source === "geolocation"} />
            </div>

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

      {/* ========================================
          SKY SUMMARY
      ======================================== */}

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

      {/* ========================================
          HIGHLIGHTS
      ======================================== */}

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

      {/* ========================================
          WEEKLY EVENTS
      ======================================== */}

      <section className="today-section event-section">
        <div className="container">
          <div className="section-label">이번 주</div>

          <h2 className="heading-ko event-section-title">주요 천문 이벤트</h2>

          {mainEvent ? (
            <>
              {/* MAIN EVENT */}

              <article
                className={
                  isRareAstronomyEvent(mainEvent) ? "event-card event-card-rare" : "event-card"
                }
              >
                <div
                  className="event-visual"
                  style={{
                    backgroundImage: `url("${mainEventImage}")`,
                  }}
                  aria-hidden="true"
                />

                <div className="event-card-overlay" />

                <div className="event-content">
                  <div className="event-meta">
                    <span className="event-date">
                      {formatAstronomyEventDate(mainEvent.date, {
                        approximate: mainEvent.approximate,
                      })}
                    </span>

                    {mainEvent.badge && (
                      <span
                        className={
                          isRareAstronomyEvent(mainEvent) ? "event-badge rare" : "event-badge"
                        }
                      >
                        <span className="event-badge-icon" aria-hidden="true">
                          {getEventIcon(mainEvent)}
                        </span>

                        {mainEvent.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="heading-ko">{mainEvent.titleKo}</h3>

                  <span className="event-name">{mainEvent.titleEn}</span>

                  <p>{mainEvent.description}</p>
                </div>
              </article>

              {/* SECONDARY EVENTS */}

              {secondaryEvents.length > 0 && (
                <div className="event-secondary-list">
                  {secondaryEvents.map(event => (
                    <EventSecondaryCard
                      key={`${event.type}-${event.date.toISOString()}`}
                      event={event}
                    />
                  ))}
                </div>
              )}

              {/* MORE EVENTS */}

              {moreEvents.length > 0 && (
                <details className="event-more">
                  <summary className="event-more-summary">
                    <span>이번 주 이벤트 더 보기</span>

                    <span className="event-more-count">+{moreEvents.length}</span>

                    <span className="event-more-arrow" aria-hidden="true">
                      ↓
                    </span>
                  </summary>

                  <div className="event-more-list">
                    {moreEvents.map(event => (
                      <EventSecondaryCard
                        key={`${event.type}-${event.date.toISOString()}`}
                        event={event}
                      />
                    ))}
                  </div>
                </details>
              )}
            </>
          ) : (
            <article className="event-card event-card-empty">
              <div
                className="event-visual"
                style={{
                  backgroundImage: 'url("/images/home/hero.png")',
                }}
                aria-hidden="true"
              />

              <div className="event-card-overlay" />

              <div className="event-content">
                <span className="event-date">앞으로 7일</span>

                <h3 className="heading-ko">예정된 주요 이벤트 없음</h3>

                <span className="event-name">QUIET SKY WEEK</span>

                <p>
                  앞으로 7일 이내에 등록된 주요 천문 이벤트가 없습니다. Tonight&apos;s
                  Highlights에서 오늘 관측하기 좋은 천체를 확인해보세요.
                </p>
              </div>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

/* ========================================
   SECONDARY EVENT CARD
======================================== */

function EventSecondaryCard({ event }) {
  const isRare = isRareAstronomyEvent(event);

  return (
    <article className={isRare ? "event-secondary-item rare" : "event-secondary-item"}>
      <div className="event-secondary-main">
        <div className="event-secondary-meta">
          <span className="event-secondary-date">
            {formatAstronomyEventDate(event.date, {
              approximate: event.approximate,
            })}
          </span>

          {event.badge && (
            <span className={isRare ? "event-mini-badge rare" : "event-mini-badge"}>
              <span aria-hidden="true" className="event-mini-badge-icon">
                {getEventIcon(event)}
              </span>

              {event.badge}
            </span>
          )}
        </div>

        <strong className="heading-ko">{event.titleKo}</strong>
      </div>

      <span className="event-secondary-name">{event.titleEn}</span>
    </article>
  );
}

/* ========================================
   RARE EVENT
======================================== */

function isRareAstronomyEvent(event) {
  return ["solar-eclipse", "lunar-eclipse", "meteor-shower", "transit"].includes(event?.type);
}

/* ========================================
   EVENT ICON
======================================== */

function getEventIcon(event) {
  switch (event?.type) {
    case "solar-eclipse":
      return "◉";

    case "lunar-eclipse":
      return "◐";

    case "meteor-shower":
      return "✦";

    case "transit":
      return "⊙";

    case "opposition":
      return "◎";

    case "elongation":
      return "◇";

    case "peak-magnitude":
      return "✧";

    case "lunar-apsis":
      return "○";

    case "moon-phase":
      return "◐";

    case "season":
      return "☼";

    default:
      return "✦";
  }
}

/* ========================================
   EVENT VISUAL
======================================== */

function getEventVisualImage(event) {
  if (!event) {
    return "/images/home/hero.png";
  }

  /*
   * 유성우 / 절기처럼
   * 하나의 천체로 표현하기 어려운 이벤트.
   */
  if (event.visualKey === "night-sky") {
    return "/images/home/hero.png";
  }

  /*
   * 달과 행성은 가지고 있는
   * 고해상도 detail 이미지 사용.
   */
  if (event.visualKey) {
    return `/images/celestial/detail/${event.visualKey}.webp`;
  }

  return "/images/home/hero.png";
}
