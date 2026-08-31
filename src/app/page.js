import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { getTodaySkyData } from "@/lib/astronomy/today";

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",

  saturn: "/images/home/saturn.png",

  m31: "/images/home/m31.png",
};

/*
 * Tonight's Highlights의
 * 추천 별점 / 관측 가능 시간은
 * 아직 임시값.
 *
 * 날짜 / 날씨 / 기온 /
 * 달 위상 / 일몰 / 월출 /
 * 관측 적합도 / 추천 시간은
 * 실제 데이터.
 */
const HIGHLIGHT_META = {
  moon: {
    rating: 5,

    time: "20:14 — 03:32",

    label: "Planetary Satellite",
  },

  saturn: {
    rating: 4,

    time: "22:47 — 05:18",

    label: "Planet",
  },

  m31: {
    rating: 3,

    time: "21:32 — 04:51",

    label: "Galaxy",
  },
};

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
   * TODAY SKY DATA
   * =========================
   *
   * 기상청 단기예보 API
   * +
   * SunCalc
   */
  const sky = await getTodaySkyData();

  /*
   * =========================
   * CELESTIAL OBJECTS
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
      magnitude,
      image_url,
      external_id
    `,
    )
    .in("external_id", ["moon", "saturn", "m31"]);

  const highlights =
    ["moon", "saturn", "m31"]
      .map(id => objects?.find(object => object.external_id === id))
      .filter(Boolean) ?? [];

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
    ,
  ];

  return (
    <main className="today-page">
      {/* =========================
          HERO
      ========================= */}

      <section className="today-hero">
        <div className="today-hero-overlay" />

        <div className="container today-hero-inner">
          <div className="today-hero-content">
            <p className="today-eyebrow">GOOD EVENING · {sky.location}</p>

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
            <h2 className="display-en">Tonight&apos;s Highlights</h2>

            <Link href="/explore" className="section-link">
              모두 탐색하기 →
            </Link>
          </div>

          {error ? (
            <p className="section-error">천체 정보를 불러오지 못했습니다.</p>
          ) : (
            <div className="highlight-grid">
              {highlights.map(object => {
                const meta = HIGHLIGHT_META[object.external_id];

                return (
                  <Link href={`/objects/${object.id}`} key={object.id} className="highlight-card">
                    <div className="highlight-image-wrapper">
                      <img
                        src={object.image_url || FALLBACK_IMAGES[object.external_id]}
                        alt={object.name_ko}
                        className="highlight-image"
                      />

                      <span className="highlight-badge">{meta.label}</span>
                    </div>

                    <div className="highlight-content">
                      <h3 className="display-en">{object.catalog_name || object.name_en}</h3>

                      <p>{object.name_ko}</p>

                      <div className="highlight-footer">
                        <Rating value={meta.rating} />

                        <span className="highlight-time">{meta.time}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
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
           * 이 부분은 아직 mock.
           * 나중에 천문 이벤트 데이터를
           * 별도로 연결할 예정.
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
