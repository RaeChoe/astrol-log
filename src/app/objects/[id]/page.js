/*
 * Object Detail Page
 *
 * [역할]
 * - /objects/[id] 경로에서 특정 천체의 상세 정보를 보여주는 페이지
 *
 * [Next.js 포인트]
 * - [id]를 이용한 Dynamic Route
 * - Server Component에서 Supabase 단건 조회
 * - 존재하지 않는 천체는 notFound()로 404 처리
 * - generateMetadata()로 천체별 동적 SEO metadata 생성
 *
 * [현재 데이터]
 * Supabase:
 * - 천체 이름 / 종류 / 설명 / 거리 / 등급 / 이미지
 *
 * Mock:
 * - 고도 / 방위 / 현재 관측 조건
 *
 * [추후 연결]
 * - 로그인 사용자 즐겨찾기 여부
 * - 실제 관측 기록
 * - 천문 API 기반 실시간 고도 / 방위 / 관측 조건
 */

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

const COLLECTION_LABELS = {
  solar_system: "Solar System",
  messier: "Messier",
  star: "Star",
  nebula: "Nebula",
  galaxy: "Galaxy",
};

export async function generateMetadata({ params }) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: object } = await supabase
    .from("celestial_objects")
    .select("name_en, name_ko, description")
    .eq("id", id)
    .maybeSingle();

  if (!object) {
    return {
      title: "천체를 찾을 수 없습니다 | AstroLog",
    };
  }

  return {
    title: `${object.name_en} | AstroLog`,
    description: object.description || `${object.name_ko}의 천체 정보와 관측 정보를 확인해보세요.`,
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

  const typeLabel = TYPE_LABELS[object.type] ?? object.type;

  const collectionLabel =
    COLLECTION_LABELS[object.collection_group] ?? object.collection_group ?? "-";

  const observationInfo = [
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
      value: object.magnitude !== null ? String(object.magnitude) : "-",
    },
    {
      label: "관측 조건",
      value: "좋음",
      accent: true,
    },
  ];

  return (
    <main className="object-detail-page">
      {/* ======================================
          HERO IMAGE
      ====================================== */}
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

      {/* ======================================
          MAIN INFORMATION
      ====================================== */}
      <section className="object-main-section">
        <div className="container">
          <div className="object-main-grid">
            {/* Left */}
            <div className="object-main-content">
              {object.catalog_name && <span className="object-catalog">{object.catalog_name}</span>}

              <h1 className="display-en object-main-title">{object.name_en}</h1>

              <h2 className="heading-ko object-main-name-ko">{object.name_ko}</h2>

              <div className="object-main-tags">
                <span className="object-type-chip">{typeLabel}</span>

                {object.distance && <span className="object-distance">{object.distance}</span>}
              </div>

              {object.description && (
                <p className="object-main-description">{object.description}</p>
              )}
            </div>

            {/* Right */}
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

                {object.catalog_name && (
                  <div>
                    <dt>카탈로그</dt>
                    <dd>{object.catalog_name}</dd>
                  </div>
                )}

                <div>
                  <dt>거리</dt>
                  <dd>{object.distance || "-"}</dd>
                </div>

                <div>
                  <dt>겉보기 등급</dt>
                  <dd>{object.magnitude !== null ? object.magnitude : "-"}</dd>
                </div>
              </dl>
            </aside>
          </div>

          {/* ======================================
              TONIGHT OBSERVATION
          ====================================== */}
          <div className="object-observation-area">
            <p className="object-sub-label">오늘의 관측 정보</p>

            <div className="object-observation-grid">
              {observationInfo.map(item => (
                <article className="object-observation-card" key={item.label}>
                  <span>{item.label}</span>

                  <strong
                    className={
                      item.accent ? "object-observation-value accent" : "object-observation-value"
                    }
                  >
                    {item.value}
                  </strong>
                </article>
              ))}
            </div>

            <p className="object-observation-notice">
              고도, 방위, 관측 조건은 현재 UI 구현을 위한 임시 데이터이며 이후 천문 API와
              연결됩니다.
            </p>
          </div>

          {/* ======================================
              PERSONAL OBSERVATION
          ====================================== */}
          <div className="object-personal-card">
            <div className="object-personal-content">
              <span className="object-personal-label">나의 관측 기록</span>

              <strong className="object-unobserved">아직 관측하지 않은 천체입니다.</strong>

              <p>첫 관측 기록을 남기면 이 천체가 나의 천체 도감에 자동으로 추가됩니다.</p>
            </div>

            <div className="object-personal-preview">
              <img src={image} alt="" />
            </div>
          </div>

          {/* ======================================
              ACTIONS
          ====================================== */}
          <div className="object-bottom-actions">
            <Link
              href={`/observations/new?object=${object.id}`}
              className="button button-primary object-record-button"
            >
              관측 기록하기
            </Link>

            <button type="button" className="button object-favorite-button">
              ☆ 관심 천체 추가
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
