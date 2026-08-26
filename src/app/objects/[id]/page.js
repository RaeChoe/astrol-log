import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",
  saturn: "/images/home/saturn.png",
  m31: "/images/home/m31.png",
};

const TYPE_LABELS = {
  planet: "Planet",
  moon: "Planetary Satellite",
  star: "Star",
  cluster: "Star Cluster",
  nebula: "Nebula",
  galaxy: "Galaxy",
};

const OBSERVATION_META = [
  {
    label: "고도",
    value: "48°",
  },
  {
    label: "방위",
    value: "NE",
  },
  {
    label: "등급",
    value: null,
    useMagnitude: true,
  },
  {
    label: "관측 조건",
    value: "좋음",
  },
];

export async function generateMetadata({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: object } = await supabase
    .from("celestial_objects")
    .select("name_en, name_ko")
    .eq("id", id)
    .maybeSingle();

  if (!object) {
    return {
      title: "천체를 찾을 수 없습니다 | AstroLog",
    };
  }

  return {
    title: `${object.name_en} | AstroLog`,
    description: `${object.name_ko}의 천체 정보와 관측 정보를 확인해보세요.`,
  };
}

export default async function ObjectDetailPage({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: object, error } = await supabase
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

  if (error || !object) {
    notFound();
  }

  const image = object.image_url || FALLBACK_IMAGES[object.external_id] || "/images/home/hero.png";

  const observationMeta = OBSERVATION_META.map(item => {
    if (item.useMagnitude) {
      return {
        ...item,
        value: object.magnitude !== null ? String(object.magnitude) : "-",
      };
    }

    return item;
  });

  return (
    <main className="object-detail-page">
      {/* HERO */}
      <section className="object-detail-hero">
        <div className="container">
          <Link href="/explore" className="object-back-link">
            ← Explore
          </Link>

          <div className="object-detail-hero-grid">
            <div className="object-detail-image-wrapper">
              <img src={image} alt={object.name_ko} className="object-detail-image" />

              <span className="object-detail-type">{TYPE_LABELS[object.type] ?? object.type}</span>
            </div>

            <div className="object-detail-heading">
              {object.catalog_name && (
                <span className="object-detail-catalog">{object.catalog_name}</span>
              )}

              <h1 className="display-en object-detail-title">{object.name_en}</h1>

              <h2 className="heading-ko object-detail-name-ko">{object.name_ko}</h2>

              <div className="object-detail-basic-meta">
                <span>{TYPE_LABELS[object.type] ?? object.type}</span>

                {object.distance && (
                  <>
                    <span className="object-meta-divider">·</span>
                    <span>{object.distance}</span>
                  </>
                )}
              </div>

              {object.description && (
                <p className="object-detail-description">{object.description}</p>
              )}

              <div className="object-detail-actions">
                <button type="button" className="button object-favorite-button">
                  ☆ 관심 천체
                </button>

                <Link
                  href={`/observations/new?object=${object.id}`}
                  className="button button-primary"
                >
                  관측 기록하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TODAY OBSERVATION */}
      <section className="object-detail-section">
        <div className="container">
          <p className="section-label">TONIGHT</p>

          <h2 className="heading-ko object-section-title">오늘의 관측 정보</h2>

          <div className="object-observation-grid">
            {observationMeta.map(item => (
              <article className="object-observation-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <p className="object-observation-notice">
            현재 고도, 방위, 관측 조건은 UI 구현을 위한 임시 데이터입니다. 이후 천문 API와 연결할
            예정입니다.
          </p>
        </div>
      </section>

      {/* PERSONAL AREA */}
      <section className="object-detail-section object-personal-section">
        <div className="container">
          <p className="section-label">MY OBSERVATION</p>

          <h2 className="heading-ko object-section-title">나의 관측 기록</h2>

          <div className="object-personal-card">
            <div className="object-personal-empty">
              <span className="object-personal-symbol">✦</span>

              <div>
                <strong>아직 관측하지 않은 천체입니다.</strong>

                <p>첫 관측 기록을 남기면 나의 천체 도감에 자동으로 추가됩니다.</p>
              </div>
            </div>

            <Link
              href={`/observations/new?object=${object.id}`}
              className="button button-secondary"
            >
              첫 관측 기록하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
