"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LATITUDE_COOKIE = "astrolog_latitude";

const LONGITUDE_COOKIE = "astrolog_longitude";

const LOCATION_PERMISSION_COOKIE = "astrolog_location_initialized";

export default function LocationControl({ isUsingCurrentLocation = false }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  function requestLocation() {
    if (!navigator.geolocation) {
      setMessage("현재 브라우저에서는 위치 기능을 사용할 수 없습니다.");

      return;
    }

    setLoading(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = Number(position.coords.latitude.toFixed(4));

        const longitude = Number(position.coords.longitude.toFixed(4));

        saveCookie(LATITUDE_COOKIE, latitude, 30 * 24 * 60 * 60);

        saveCookie(LONGITUDE_COOKIE, longitude, 30 * 24 * 60 * 60);

        saveCookie(LOCATION_PERMISSION_COOKIE, "true", 24 * 60 * 60);

        setLoading(false);

        router.refresh();
      },

      error => {
        setLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          setMessage("위치 권한이 허용되지 않아 서울 기준 정보를 표시합니다.");

          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setMessage("현재 위치를 확인할 수 없습니다.");

          return;
        }

        if (error.code === error.TIMEOUT) {
          setMessage("위치 확인 시간이 초과되었습니다.");

          return;
        }

        setMessage("현재 위치를 불러오지 못했습니다.");
      },

      {
        enableHighAccuracy: false,

        timeout: 8000,

        maximumAge: 30 * 60 * 1000,
      },
    );
  }

  return (
    <div className="location-control">
      <div className="location-control-main">
        <span
          className={isUsingCurrentLocation ? "location-status-dot active" : "location-status-dot"}
          aria-hidden="true"
        />

        <span className="location-status-text">
          {isUsingCurrentLocation ? "현재 위치 사용 중" : "서울 기준"}
        </span>

        {!isUsingCurrentLocation && (
          <button
            type="button"
            className="location-use-button"
            onClick={requestLocation}
            disabled={loading}
          >
            {loading ? "위치 확인 중..." : "현재 위치 사용"}
          </button>
        )}
      </div>

      {message && (
        <p className="location-control-message" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function saveCookie(name, value, maxAge) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}
