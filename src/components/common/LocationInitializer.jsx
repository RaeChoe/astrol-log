"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

const LATITUDE_COOKIE = "astrolog_latitude";

const LONGITUDE_COOKIE = "astrolog_longitude";

const LOCATION_PERMISSION_COOKIE = "astrolog_location_initialized";

/*
 * 너무 미세한 GPS 변화로
 * 매번 refresh되는 것을 방지.
 */
const COORDINATE_PRECISION = 4;

export default function LocationInitializer() {
  const router = useRouter();

  useEffect(() => {
    /*
     * 이미 이번 브라우저에서
     * 위치 초기화를 수행했다면
     * 다시 권한을 요청하지 않는다.
     */
    const initialized = getCookie(LOCATION_PERMISSION_COOKIE);

    if (initialized === "true") {
      return;
    }

    if (!navigator.geolocation) {
      saveInitialized();

      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = Number(position.coords.latitude.toFixed(COORDINATE_PRECISION));

        const longitude = Number(position.coords.longitude.toFixed(COORDINATE_PRECISION));

        const previousLatitude = Number(getCookie(LATITUDE_COOKIE));

        const previousLongitude = Number(getCookie(LONGITUDE_COOKIE));

        saveCoordinate(LATITUDE_COOKIE, latitude);

        saveCoordinate(LONGITUDE_COOKIE, longitude);

        saveInitialized();

        /*
         * 기존 좌표와 실제 좌표가 다를 때만
         * Server Component 새로고침.
         */
        if (previousLatitude !== latitude || previousLongitude !== longitude) {
          router.refresh();
        }
      },

      error => {
        /*
         * 위치 거부 / 타임아웃 / 오류 시
         * 서울 fallback을 그대로 사용.
         */
        console.info("현재 위치를 사용할 수 없습니다.", error.code);

        saveInitialized();
      },

      {
        enableHighAccuracy: false,

        timeout: 8000,

        maximumAge: 30 * 60 * 1000,
      },
    );
  }, [router]);

  return null;
}

function saveCoordinate(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; samesite=lax`;
}

function saveInitialized() {
  document.cookie = `${LOCATION_PERMISSION_COOKIE}=true; path=/; max-age=86400; samesite=lax`;
}

function getCookie(name) {
  const prefix = `${name}=`;

  const cookie = document.cookie.split("; ").find(item => item.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}
