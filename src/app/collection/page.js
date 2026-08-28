import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import CollectionCard from "@/components/collection/CollectionCard";

export const metadata = {
  title: "Collection | AstroLog",
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

  const objects = objectsResult.data || [];

  const observations = observationsResult.data || [];

  /*
   * celestial_object_id 기준으로
   * 관측 횟수 / 최근 관측일 계산
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
      <section className="container collection-header">
        <span className="section-label">MY COLLECTION</span>

        <h1 className="heading-ko">나의 천체 도감</h1>

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
