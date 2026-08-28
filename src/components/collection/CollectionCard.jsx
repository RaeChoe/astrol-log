import Link from "next/link";

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
      className={
        object.observed ? "collection-mini-card observed" : "collection-mini-card unobserved"
      }
    >
      <div className="collection-mini-image">
        <img src={image} alt={object.name_ko || object.name_en} />

        {!object.observed && (
          <div className="collection-mini-lock">
            <span />
          </div>
        )}

        {object.observed && <span className="collection-mini-check">✓</span>}
      </div>

      <div className="collection-mini-content">
        <strong>{getCardTitle(object)}</strong>

        <span>{object.name_ko}</span>
      </div>
    </Link>
  );
}

function getCardTitle(object) {
  /*
   * Messier object는
   * M31 / M42 / M45처럼
   * catalog_name을 우선 노출
   */
  if (object.collection_group === "messier" && object.catalog_name) {
    return object.catalog_name;
  }

  return object.name_en || object.catalog_name || object.name_ko || "Unknown";
}
