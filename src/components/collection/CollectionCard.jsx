import Link from "next/link";

import SafeImage from "@/components/common/SafeImage";

import { getCelestialThumbnail } from "@/lib/celestial/images";

export default function CollectionCard({ object }) {
  const image = getCelestialThumbnail(object);

  return (
    <Link
      href={`/objects/${object.id}`}
      className={
        object.observed ? "collection-mini-card observed" : "collection-mini-card unobserved"
      }
    >
      <div className="collection-mini-image">
        <SafeImage
          src={image}
          fallbackSrc="/images/home/hero.png"
          alt={object.name_ko || object.name_en || "천체 이미지"}
        />

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
   * catalog_name을 우선 노출.
   */
  if (object.collection_group === "messier" && object.catalog_name) {
    return object.catalog_name;
  }

  return object.name_en || object.catalog_name || object.name_ko || "Unknown";
}
