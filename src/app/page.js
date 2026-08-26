import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",
  saturn: "/images/home/saturn.png",
  m31: "/images/home/m31.png",
};

const OBSERVATION_INFO = [
  {
    label: "달 위상",
    value: "상현달",
    sub: "74%",
    icon: "◐",
  },
  {
    label: "일몰",
    value: "19:02",
    sub: "KST",
    icon: "◒",
  },
  {
    label: "월출",
    value: "20:11",
    sub: "KST",
    icon: "○",
  },
  {
    label: "관측 조건",
    value: "좋음",
    sub: "시상 4/5",
    icon: "◉",
  },
  {
    label: "추천 시간",
    value: "22:00",
    sub: "— 01:00",
    icon: "◇",
  },
];

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
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < value ? "star active" : "star"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();

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

  return (
    <main className="today-page">
      {/* HERO */}
      <section className="today-hero">
        <div className="today-hero-overlay" />

        <div className="container today-hero-inner">
          <div className="today-hero-content">
            <p className="today-eyebrow">GOOD EVENING · SEOUL, KOREA</p>

            <h1 className="heading-ko today-title">
              <span>오늘 밤,</span>
              <span>무엇을 볼까요?</span>
            </h1>

            <div className="today-meta">
              <span>2026.08.26</span>
              <span>맑음</span>
              <span>23°C</span>
              <span>시상 4/5</span>
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

      {/* SKY SUMMARY */}
      <section className="sky-summary-section">
        <div className="container">
          <div className="sky-summary">
            {OBSERVATION_INFO.map(item => (
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

      {/* HIGHLIGHTS */}
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

      {/* WEEKLY EVENT */}
      <section className="today-section event-section">
        <div className="container">
          <div className="section-label">이번 주</div>

          <h2 className="heading-ko event-section-title">주요 천문 이벤트</h2>

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
