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
  favoriteObjectIds = [],
  isLoggedIn = false,
  loadError = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  /*
   * 관측 완료 천체 Set
   */
  const observedSet = useMemo(() => {
    return new Set(observedObjectIds.map(String));
  }, [observedObjectIds]);

  /*
   * 관심 천체 Set
   */
  const favoriteSet = useMemo(() => {
    return new Set(favoriteObjectIds.map(String));
  }, [favoriteObjectIds]);

  /*
   * 검색 + 카테고리 + 관심 천체 필터
   */
  const filteredObjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return objects.filter(object => {
      const objectId = String(object.id);

      const matchesSearch =
        !search ||
        object.catalog_name?.toLowerCase().includes(search) ||
        object.name_en?.toLowerCase().includes(search) ||
        object.name_ko?.toLowerCase().includes(search);

      let matchesFilter = true;

      if (activeFilter === "favorite") {
        matchesFilter = favoriteSet.has(objectId);
      } else if (activeFilter === "solar_system") {
        matchesFilter = object.collection_group === "solar_system";
      } else if (activeFilter !== "all") {
        matchesFilter = object.type === activeFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [objects, searchTerm, activeFilter, favoriteSet]);

  const totalPages = Math.max(1, Math.ceil(filteredObjects.length / ITEMS_PER_PAGE));

  const paginatedObjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredObjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredObjects, currentPage]);

  /*
   * 검색 / 필터 변경 시
   * 첫 페이지로 이동.
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
              disabled={loadError}
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
                disabled={loadError}
              >
                {filter.label}
              </button>
            ))}

            {isLoggedIn && (
              <button
                type="button"
                className={
                  activeFilter === "favorite"
                    ? "filter-chip favorite active"
                    : "filter-chip favorite"
                }
                onClick={() => setActiveFilter("favorite")}
                disabled={loadError}
              >
                <span aria-hidden="true">★</span>
                관심
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =========================
          RESULTS
      ========================= */}

      <section className="explore-results">
        <div className="container">
          {loadError ? (
            <div className="data-error-state">
              <span className="data-error-symbol" aria-hidden="true">
                ✦
              </span>

              <h2>천체 정보를 불러오지 못했습니다</h2>

              <p>네트워크 상태를 확인한 뒤 페이지를 새로고침해주세요.</p>

              <button
                type="button"
                className="button button-secondary"
                onClick={() => window.location.reload()}
              >
                다시 불러오기
              </button>
            </div>
          ) : (
            <>
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
                  <span>{activeFilter === "favorite" ? "☆" : "✦"}</span>

                  <h2>
                    {activeFilter === "favorite" ? "관심 천체가 없습니다" : "검색 결과가 없습니다"}
                  </h2>

                  <p>
                    {activeFilter === "favorite"
                      ? "관심 있는 천체를 저장하면 이곳에서 모아볼 수 있습니다."
                      : "다른 검색어나 필터를 선택해보세요."}
                  </p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="pagination-arrow"
                    aria-label="이전 페이지"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  >
                    ←
                  </button>

                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, index) => {
                      const page = index + 1;

                      return (
                        <button
                          type="button"
                          key={page}
                          className={
                            currentPage === page ? "pagination-button active" : "pagination-button"
                          }
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    },
                  )}

                  <button
                    type="button"
                    className="pagination-arrow"
                    aria-label="다음 페이지"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
