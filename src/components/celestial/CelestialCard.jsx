import Link from "next/link";

const FALLBACK_IMAGES = {
  moon: "/images/home/moon.png",
  saturn: "/images/home/saturn.png",
  m31: "/images/home/m31.png",

  // jupiter: "/images/celestial/jupiter.png",
  // mars: "/images/celestial/mars.png",
  // m42: "/images/celestial/m42.png",
  // m45: "/images/celestial/m45.png",
  // sirius: "/images/celestial/sirius.png",
  // betelgeuse: "/images/celestial/betelgeuse.png",
};

const TYPE_LABELS = {
  planet: "Planet",
  moon: "Planetary Satellite",
  star: "Star",
  cluster: "Star Cluster",
  nebula: "Nebula",
  galaxy: "Galaxy",
};

export default function CelestialCard({ object }) {
  const image = object.image_url || FALLBACK_IMAGES[object.external_id] || "/images/home/hero.png";

  return (
    <Link href={`/objects/${object.id}`} className="celestial-card">
      <div className="celestial-card-image-wrapper">
        <img src={image} alt={object.name_ko} className="celestial-card-image" />

        <span className="celestial-card-type">{TYPE_LABELS[object.type] ?? object.type}</span>
      </div>

      <div className="celestial-card-content">
        <div>
          <span className="celestial-catalog">
            {object.catalog_name || TYPE_LABELS[object.type]}
          </span>

          <h2 className="display-en">{object.name_en}</h2>

          <p>{object.name_ko}</p>
        </div>

        <div className="celestial-card-meta">
          <span>{TYPE_LABELS[object.type] ?? object.type}</span>

          {object.distance && <span>{object.distance}</span>}
        </div>
      </div>
    </Link>
  );
}
