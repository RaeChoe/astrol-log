import Link from "next/link";

const TYPE_LABELS = {
  planet: "행성",
  moon: "위성",
  star: "별",
  cluster: "성단",
  nebula: "성운",
  galaxy: "은하",
};

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",
  saturn: "/images/home/saturn.png",
  m31: "/images/home/m31.png",
};

export default function CollectionCard({ object }) {
  const image = object.image_url || FALLBACK_IMAGES[object.external_id] || "/images/home/hero.png";

  return (
    <Link
      href={`/objects/${object.id}`}
      className={object.observed ? "collection-card observed" : "collection-card unobserved"}
    >
      <div className="collection-card-image-wrapper">
        <img src={image} alt={object.name_ko || object.name_en} className="collection-card-image" />

        <div className="collection-card-image-overlay" />

        <span className={object.observed ? "collection-status observed" : "collection-status"}>
          {object.observed ? "✓ 관측 완료" : "○ 미관측"}
        </span>

        <span className="collection-card-type">{TYPE_LABELS[object.type] || object.type}</span>

        {!object.observed && (
          <div className="collection-lock">
            <span>✦</span>
          </div>
        )}
      </div>

      <div className="collection-card-content">
        <div>
          <span className="celestial-catalog">{object.catalog_name || "CELESTIAL OBJECT"}</span>

          <h3>{object.name_en}</h3>

          <p>{object.name_ko}</p>
        </div>

        <div className="collection-card-footer">
          {object.observed ? (
            <>
              <span>관측 {object.observationCount}회</span>

              <span>최근 {formatDate(object.lastObservedAt)}</span>
            </>
          ) : (
            <>
              <span>아직 만나지 못한 천체</span>

              <strong>관측하러 가기 →</strong>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
