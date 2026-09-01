import { requireUser } from "@/lib/auth/requireUser";

import { createClient } from "@/lib/supabase/server";

import CollectionCard from "@/components/collection/CollectionCard";

export const metadata = {
  title: "Collection",
  robots: {
    index: false,
    follow: false,
  },
};

const GROUPS = [
  {
    key: "solar_system",
    title: "태양계",
  },

  {
    key: "messier",
    title: "Messier Objects",
  },

  {
    key: "star",
    title: "별",
  },
];

export default async function CollectionPage() {
  const user = await requireUser("/collection");

  const supabase = await createClient();

  const [objectsResult, observationsResult] = await Promise.all([
    supabase
      .from("celestial_objects")
      .select(
        `
          id,
          catalog_name,
          name_en,
          name_ko,
          type,
          collection_group,
          image_url,
          external_id
        `,
      )
      .order("id"),

    supabase
      .from("observations")
      .select(
        `
          id,
          celestial_object_id,
          observed_at
        `,
      )
      .eq("user_id", user.id)
      .order("observed_at", {
        ascending: false,
      }),
  ]);

  if (objectsResult.error) {
    console.error("Collection 천체 조회 오류:", objectsResult.error);
  }

  if (observationsResult.error) {
    console.error("Collection 관측 기록 조회 오류:", observationsResult.error);
  }

  /*
   * 천체 데이터 자체가 실패하면
   * 정상적인 0/0 상태처럼 보이지 않도록
   * 별도 오류 화면 표시
   */
  if (objectsResult.error) {
    return (
      <main className="collection-page">
        <section className="container collection-header">
          <span className="section-label">MY COLLECTION</span>

          <h1 className="heading-ko">나의 천체 도감</h1>
        </section>

        <section className="container">
          <div className="data-error-state">
            <span className="data-error-symbol" aria-hidden="true">
              ✦
            </span>

            <h2>천체 도감을 불러오지 못했습니다</h2>

            <p>일시적인 문제일 수 있습니다. 잠시 후 다시 시도해주세요.</p>
          </div>
        </section>
      </main>
    );
  }

  const objects = objectsResult.data || [];

  /*
   * 관측 기록 조회 실패 시에도
   * 도감 자체는 표시
   */
  const observations = observationsResult.data || [];

  /*
   * 천체별 관측 횟수 / 최근 관측일 계산
   */
  const observationMap = new Map();

  observations.forEach(observation => {
    const objectId = observation.celestial_object_id;

    const current = observationMap.get(objectId);

    if (!current) {
      observationMap.set(objectId, {
        count: 1,
        lastObservedAt: observation.observed_at,
      });

      return;
    }

    current.count += 1;
  });

  const collectionObjects = objects.map(object => {
    const info = observationMap.get(object.id);

    return {
      ...object,

      observed: Boolean(info),

      observationCount: info?.count || 0,

      lastObservedAt: info?.lastObservedAt || null,
    };
  });

  const observedCount = collectionObjects.filter(object => object.observed).length;

  const totalCount = collectionObjects.length;

  const progress = totalCount > 0 ? Math.round((observedCount / totalCount) * 100) : 0;

  return (
    <main className="collection-page">
      {/* ========================================
          HEADER
      ======================================== */}

      <section className="container collection-header">
        <span className="section-label">MY COLLECTION</span>

        <h1 className="heading-ko">나의 천체 도감</h1>

        {observationsResult.error && (
          <p className="data-inline-warning" role="status">
            관측 기록을 불러오지 못해 수집 현황이 정확하지 않을 수 있습니다.
          </p>
        )}

        {/* ========================================
            OVERALL PROGRESS
        ======================================== */}

        <div className="collection-overall">
          <div className="collection-overall-count">
            <span>OBJECTS OBSERVED</span>

            <p>
              <strong>{observedCount}</strong>

              <span>/ {totalCount}</span>
            </p>
          </div>

          <div className="collection-overall-progress">
            <div className="collection-overall-progress-head">
              <span>전체 수집 현황</span>

              <strong>{progress}%</strong>
            </div>

            <div className="collection-progress-track">
              <div
                className="collection-progress-bar"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          COLLECTION GROUPS
      ======================================== */}

      <section className="container collection-groups">
        {GROUPS.map(group => {
          const groupObjects = collectionObjects.filter(
            object => object.collection_group === group.key,
          );

          if (!groupObjects.length) {
            return null;
          }

          const groupObserved = groupObjects.filter(object => object.observed).length;

          return (
            <section key={group.key} className="collection-group">
              <div className="collection-group-header">
                <div>
                  <h2>{group.title}</h2>

                  <p>{groupObserved}개 관측 완료</p>
                </div>

                <strong>
                  {groupObserved}

                  <span> / {groupObjects.length}</span>
                </strong>
              </div>

              <div className="collection-group-grid">
                {groupObjects.map(object => (
                  <CollectionCard key={object.id} object={object} />
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
