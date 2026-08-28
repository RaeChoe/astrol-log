import Link from "next/link";

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

export default function CelestialCard({ object, observed = false, isLoggedIn = false }) {
  const image = object.image_url || FALLBACK_IMAGES[object.external_id] || "/images/home/hero.png";

  const typeLabel = TYPE_LABELS[object.type] || object.type;

  return (
    <Link
      href={`/objects/${object.id}`}
      className={observed ? "celestial-card observed" : "celestial-card"}
    >
      <div className="celestial-card-image-wrapper">
        <img className="celestial-card-image" src={image} alt={object.name_ko || object.name_en} />

        <span className="celestial-card-type">{typeLabel}</span>

        {isLoggedIn && (
          <span
            className={
              observed ? "celestial-observation-status observed" : "celestial-observation-status"
            }
          >
            {observed ? "✓ 관측 완료" : "○ 미관측"}
          </span>
        )}
      </div>

      <div className="celestial-card-content">
        <div>
          <span className="celestial-catalog">{object.catalog_name || typeLabel}</span>

          <h2>{object.name_en}</h2>

          <p>{object.name_ko}</p>
        </div>

        <div className="celestial-card-meta">
          <span>{typeLabel}</span>

          {object.distance && <span>{object.distance}</span>}
        </div>
      </div>
    </Link>
  );
}
