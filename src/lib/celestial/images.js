export function getCelestialThumbnail(object) {
  if (object?.external_id) {
    return `/images/celestial/thumbs/${object.external_id}.webp`;
  }

  return object?.image_url || "/images/home/hero.png";
}

export function getCelestialDetailImage(object) {
  return object?.image_url || "/images/home/hero.png";
}
