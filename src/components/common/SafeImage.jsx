"use client";

import { useState } from "react";

const DEFAULT_FALLBACK = "/images/home/hero.png";

export default function SafeImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt = "",
  onError,
  ...props
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  const [fallbackApplied, setFallbackApplied] = useState(false);

  function handleError(event) {
    /*
     * 사용자가 별도로 onError를 전달했다면
     * 기존 동작도 유지한다.
     */
    if (typeof onError === "function") {
      onError(event);
    }

    /*
     * fallback 이미지 자체도 실패했을 때
     * 무한 반복되는 것을 방지.
     */
    if (fallbackApplied || currentSrc === fallbackSrc) {
      return;
    }

    setFallbackApplied(true);

    setCurrentSrc(fallbackSrc);
  }

  return <img {...props} src={currentSrc} alt={alt} onError={handleError} />;
}
