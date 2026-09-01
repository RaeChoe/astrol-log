"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import SafeImage from "@/components/common/SafeImage";

const FILTERS = [
  {
    value: "all",
    label: "전체",
  },
  {
    value: "planet",
    label: "행성",
  },
  {
    value: "moon",
    label: "달",
  },
  {
    value: "star",
    label: "별",
  },
  {
    value: "cluster",
    label: "성단",
  },
  {
    value: "nebula",
    label: "성운",
  },
  {
    value: "galaxy",
    label: "은하",
  },
];

const EQUIPMENT_LABELS = {
  naked_eye: "맨눈",
  binoculars: "쌍안경",
  telescope: "망원경",
  camera: "카메라",
};

export default function ObservationsClient({ observations = [] }) {
  const [filter, setFilter] = useState("all");

  /*
   * 선택한 천체 종류에 따라
   * 관측 기록 필터링
   */
  const filteredObservations = useMemo(() => {
    if (filter === "all") {
      return observations;
    }

    return observations.filter(observation => observation.celestial_objects?.type === filter);
  }, [filter, observations]);

  /*
   * 월별로 관측 기록 묶기
   *
   * AUGUST 2026
   * JULY 2026
   * ...
   */
  const groupedObservations = useMemo(() => {
    return groupByMonth(filteredObservations);
  }, [filteredObservations]);

  return (
    <main className="observations-page">
      {/* =========================
          HEADER
      ========================= */}

      <section className="container observations-design-header">
        <span className="section-label">OBSERVATIONS</span>

        <div className="observations-title-row">
          <div>
            <h1 className="heading-ko">관측 기록</h1>

            <p>밤하늘에서 만난 순간들을 다시 돌아보세요.</p>
          </div>

          <Link href="/observations/new" className="button button-primary">
            + 새 관측 기록
          </Link>
        </div>

        {/* =========================
            FILTERS
        ========================= */}

        <div className="observations-filter-list">
          {FILTERS.map(item => (
            <button
              key={item.value}
              type="button"
              className={
                filter === item.value ? "observations-filter active" : "observations-filter"
              }
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* =========================
          RECORDS
      ========================= */}

      <section className="container observations-records">
        {!filteredObservations.length ? (
          <div className="observations-empty">
            <span>✦</span>

            <h2>관측 기록이 없습니다</h2>

            <p>
              {filter === "all"
                ? "아직 남겨진 관측 기록이 없습니다."
                : "이 분류의 관측 기록이 아직 없습니다."}
            </p>

            {filter === "all" && (
              <Link href="/observations/new" className="button button-primary">
                첫 관측 기록하기
              </Link>
            )}
          </div>
        ) : (
          Object.entries(groupedObservations).map(([month, records]) => (
            <section key={month} className="observation-month-group">
              <h2>{month}</h2>

              <div className="observation-record-list">
                {records.map(observation => (
                  <ObservationRow key={observation.id} observation={observation} />
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </main>
  );
}

function ObservationRow({ observation }) {
  const object = observation.celestial_objects;

  const date = new Date(observation.observed_at);

  const day = String(date.getDate()).padStart(2, "0");

  const monthShort = new Intl.DateTimeFormat("en-US", {
    month: "short",
  })
    .format(date)
    .toUpperCase();

  const equipmentLabel = EQUIPMENT_LABELS[observation.equipment] || observation.equipment || "-";

  return (
    <Link href={`/observations/${observation.id}`} className="observation-record-card">
      {/* =========================
          DATE
      ========================= */}

      <div className="observation-record-date">
        <strong>{day}</strong>

        <span>{monthShort}</span>
      </div>

      {/* =========================
          THUMBNAIL
      ========================= */}

      <div className="observation-record-thumbnail">
        <SafeImage
          src={observation.thumbnail}
          fallbackSrc="/images/home/hero.png"
          alt={object?.name_ko || object?.name_en || "관측 천체"}
        />
      </div>

      {/* =========================
          CONTENT
      ========================= */}

      <div className="observation-record-main">
        <div className="observation-record-title">
          <strong>{getPrimaryObjectName(object)}</strong>

          {getSecondaryObjectName(object) && <span>{getSecondaryObjectName(object)}</span>}
        </div>

        <div className="observation-record-meta">
          {observation.location_name && <span className="accent">{observation.location_name}</span>}

          <span>{equipmentLabel}</span>

          <span className="observation-record-stars">
            {"★".repeat(observation.rating || 0)}

            {"☆".repeat(5 - (observation.rating || 0))}
          </span>

          {observation.imageCount > 0 && <span>사진 {observation.imageCount}장</span>}
        </div>

        {observation.note && <p>“{truncate(observation.note, 90)}”</p>}
      </div>

      {/* =========================
          ARROW
      ========================= */}

      <span className="observation-record-arrow">→</span>
    </Link>
  );
}

function getPrimaryObjectName(object) {
  if (!object) {
    return "Unknown Object";
  }

  return object.catalog_name || object.name_en || object.name_ko || "Unknown Object";
}

function getSecondaryObjectName(object) {
  if (!object) {
    return "";
  }

  const pieces = [];

  if (object.name_en && object.name_en.toLowerCase() !== object.catalog_name?.toLowerCase()) {
    pieces.push(object.name_en);
  }

  if (object.name_ko) {
    pieces.push(object.name_ko);
  }

  return pieces.join(" · ");
}

function groupByMonth(observations) {
  return observations.reduce((groups, observation) => {
    const date = new Date(observation.observed_at);

    const key = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    })
      .format(date)
      .toUpperCase();

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(observation);

    return groups;
  }, {});
}

function truncate(text, maxLength) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}…`;
}
