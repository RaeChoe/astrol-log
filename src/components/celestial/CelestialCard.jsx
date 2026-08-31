import Link from "next/link";

import { getCelestialThumbnail } from "@/lib/celestial/images";

const TYPE_LABELS = {
  planet: "Planet",
  moon: "Planetary Satellite",
  star: "Star",
  cluster: "Star Cluster",
  nebula: "Nebula",
  galaxy: "Galaxy",
};

export default function CelestialCard({ object, observed = false, isLoggedIn = false }) {
  const image = getCelestialThumbnail(object);

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
