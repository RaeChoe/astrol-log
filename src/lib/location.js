import { cookies } from "next/headers";

export const DEFAULT_LOCATION = {
  latitude: 37.5665,
  longitude: 126.978,
  label: "SEOUL, KOREA",
  source: "default",
};

const LATITUDE_COOKIE = "astrolog_latitude";

const LONGITUDE_COOKIE = "astrolog_longitude";

/*
 * 서버 컴포넌트에서 사용할
 * 현재 관측 위치.
 *
 * 사용자가 브라우저 위치 권한을 허용했다면
 * cookie에 저장된 실제 위치를 사용하고,
 *
 * 없거나 잘못된 값이면 서울 fallback.
 */
export async function getObserverLocation() {
  const cookieStore = await cookies();

  const latitude = Number(cookieStore.get(LATITUDE_COOKIE)?.value);

  const longitude = Number(cookieStore.get(LONGITUDE_COOKIE)?.value);

  if (
    isValidCoordinate({
      latitude,
      longitude,
    })
  ) {
    return {
      latitude,
      longitude,

      label: "CURRENT LOCATION",

      source: "geolocation",
    };
  }

  return DEFAULT_LOCATION;
}

function isValidCoordinate({ latitude, longitude }) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
