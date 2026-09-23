"use client";

import { useEffect, useState } from "react";

import styles from "./InitialLoading.module.css";

export default function InitialLoading() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, 650);

    const removeTimer = window.setTimeout(() => {
      setIsLoading(false);
    }, 950);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={`${styles.loading} ${isLeaving ? styles.leaving : ""}`}
      aria-live="polite"
      aria-label="페이지를 불러오는 중"
    >
      <div className={styles.inner}>
        <span className={styles.symbol} aria-hidden="true">
          ✦
        </span>

        <span className={styles.text}>밤하늘을 불러오는 중</span>

        <div className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
