"use client";

import { useEffect, useMemo, useState } from "react";

import CelestialCard from "@/components/celestial/CelestialCard";

const ITEMS_PER_PAGE = 8;

const FILTERS = [
  {
    value: "all",
    label: "전체",
  },
  {
    value: "solar_system",
    label: "태양계",
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

export default function ExploreClient({
  objects = [],
  observedObjectIds = [],
  isLoggedIn = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  /*
   * 로그인 사용자가 이미 관측한 천체 id
   */
  const observedSet = useMemo(() => {
    return new Set(observedObjectIds.map(String));
  }, [observedObjectIds]);

  /*
   * 검색 + 필터
   */
  const filteredObjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return objects.filter(object => {
      const matchesSearch =
        !search ||
        object.catalog_name?.toLowerCase().includes(search) ||
        object.name_en?.toLowerCase().includes(search) ||
        object.name_ko?.toLowerCase().includes(search);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "solar_system"
          ? object.collection_group === "solar_system"
          : object.type === activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [objects, searchTerm, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredObjects.length / ITEMS_PER_PAGE));

  const paginatedObjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredObjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredObjects, currentPage]);

  /*
   * 검색어나 필터 변경 시
   * 첫 페이지로 초기화
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  return (
    <main className="explore-page">
      {/* =========================
          HERO
      ========================= */}

      <section className="explore-hero">
        <div className="container">
          <span className="section-label">CELESTIAL CATALOG</span>

          <h1 className="display-en explore-title">
            Explore
            <br />
            the night sky.
          </h1>

          <p className="explore-description">밤하늘의 천체들을 탐색해보세요.</p>

          {/* =========================
              SEARCH
          ========================= */}

          <div className="explore-search-wrapper">
            <span className="explore-search-icon" aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              className="explore-search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="천체 이름을 검색하세요..."
              aria-label="천체 검색"
            />
          </div>

          {/* =========================
              FILTER
          ========================= */}

          <div className="explore-filters">
            {FILTERS.map(filter => (
              <button
                key={filter.value}
                type="button"
                className={activeFilter === filter.value ? "filter-chip active" : "filter-chip"}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          RESULTS
      ========================= */}

      <section className="explore-results">
        <div className="container">
          <div className="explore-results-header">
            <p>
              <strong>{filteredObjects.length}</strong>
              개의 천체
            </p>

            {isLoggedIn && (
              <div className="explore-observation-guide">
                <i className="observed" />

                <span>관측 완료</span>

                <i />

                <span>미관측</span>
              </div>
            )}
          </div>

          {paginatedObjects.length ? (
            <div className="celestial-grid">
              {paginatedObjects.map(object => (
                <CelestialCard
                  key={object.id}
                  object={object}
                  isLoggedIn={isLoggedIn}
                  observed={observedSet.has(String(object.id))}
                />
              ))}
            </div>
          ) : (
            <div className="explore-empty">
              <span>✦</span>

              <h2>검색 결과가 없습니다</h2>

              <p>다른 이름이나 분류로 검색해보세요.</p>
            </div>
          )}

          {/* =========================
              PAGINATION
          ========================= */}

          {filteredObjects.length > ITEMS_PER_PAGE && (
            <div className="pagination">
              <button
                type="button"
                className="pagination-arrow"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="이전 페이지"
              >
                ←
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) => index + 1,
              ).map(page => (
                <button
                  key={page}
                  type="button"
                  className={
                    currentPage === page ? "pagination-button active" : "pagination-button"
                  }
                  onClick={() => setCurrentPage(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="pagination-arrow"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                aria-label="다음 페이지"
              >
                →
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
