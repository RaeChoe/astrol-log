import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import CollectionCard from "@/components/collection/CollectionCard";

export const metadata = {
  title: "Collection | AstroLog",
};

export default async function CollectionPage() {
  const user = await requireUser("/collection");

  const supabase = await createClient();

  /*
   * 전체 천체와 현재 사용자의 관측 기록을 동시에 조회
   */
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
        distance,
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

  const objects = objectsResult.data || [];
  const observations = observationsResult.data || [];

  /*
   * celestial_object_id 기준으로
   * 관측 정보를 묶는다.
   *
   * Map:
   * objectId →
   * {
   *   count,
   *   lastObservedAt
   * }
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

  /*
   * 각 celestial object에
   * 관측 여부 및 통계 추가
   */
  const collectionObjects = objects.map(object => {
    const observationInfo = observationMap.get(object.id);

    return {
      ...object,

      observed: Boolean(observationInfo),

      observationCount: observationInfo?.count || 0,

      lastObservedAt: observationInfo?.lastObservedAt || null,
    };
  });

  const observedCount = collectionObjects.filter(object => object.observed).length;

  const totalCount = collectionObjects.length;

  const progress = totalCount > 0 ? Math.round((observedCount / totalCount) * 100) : 0;

  /*
   * 관측 완료한 천체를 먼저 표시
   */
  const sortedObjects = [...collectionObjects].sort((a, b) => {
    if (a.observed === b.observed) {
      return a.id - b.id;
    }

    return a.observed ? -1 : 1;
  });

  return (
    <main className="collection-page">
      <section className="container collection-hero">
        <span className="section-label">CELESTIAL COLLECTION</span>

        <div className="collection-hero-grid">
          <div className="collection-heading">
            <h1 className="display-en">Collection</h1>

            <p>밤하늘에서 직접 만난 천체들을 하나씩 기록하고 도감을 완성해보세요.</p>
          </div>

          <div className="collection-progress-panel">
            <div className="collection-progress-top">
              <div>
                <span>COLLECTION PROGRESS</span>

                <strong>{progress}%</strong>
              </div>

              <p>
                <strong>{observedCount}</strong>
                <span> / {totalCount}</span>
              </p>
            </div>

            <div className="collection-progress-track">
              <div
                className="collection-progress-bar"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p className="collection-progress-description">
              {getProgressMessage(progress, observedCount)}
            </p>
          </div>
        </div>
      </section>

      <section className="container collection-content">
        <div className="collection-section-heading">
          <div>
            <span className="section-label">YOUR DISCOVERIES</span>

            <h2>나의 천체 도감</h2>
          </div>

          <div className="collection-legend">
            <span>
              <i className="collection-legend-dot observed" />
              관측 완료
            </span>

            <span>
              <i className="collection-legend-dot" />
              미관측
            </span>
          </div>
        </div>

        {sortedObjects.length ? (
          <div className="collection-grid">
            {sortedObjects.map(object => (
              <CollectionCard key={object.id} object={object} />
            ))}
          </div>
        ) : (
          <div className="collection-empty">
            <span>✦</span>

            <h2>등록된 천체가 없습니다</h2>

            <p>천체 데이터가 추가되면 이곳에 도감이 표시됩니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function getProgressMessage(progress, observedCount) {
  if (progress === 100) {
    return "모든 천체를 관측했습니다. 도감 완성!";
  }

  if (progress >= 70) {
    return "도감 완성이 얼마 남지 않았어요.";
  }

  if (progress >= 40) {
    return "밤하늘의 절반 가까이를 만나고 있어요.";
  }

  if (observedCount > 0) {
    return "좋은 시작이에요. 다음 천체를 찾아보세요.";
  }

  return "첫 번째 천체를 관측하면 도감이 시작됩니다.";
}
