"use client";

/*
ExploreClient

[역할]
- Explore 페이지의 검색 / 카테고리 필터 / 결과 렌더링을 담당하는 Client Component

[왜 Client Component인가?]
- 검색어(searchTerm), 선택 필터(selectedFilter)처럼
  사용자의 입력에 따라 즉시 화면이 바뀌는 상태가 필요하기 때문
- useState, useMemo 등 React Client Hook을 사용하므로 "use client"가 필요함

[데이터 흐름]
1. /explore/page.js(Server Component)에서 Supabase의
   celestial_objects 데이터를 먼저 조회
2. 조회한 objects 배열을 props로 ExploreClient에 전달
3. ExploreClient에서는 DB를 다시 요청하지 않고
   전달받은 데이터를 기준으로 검색 / 필터링만 수행

Server Component
  → Supabase 조회
  → objects 전달
  → ExploreClient
  → 검색 / 필터 / 결과 렌더링

[검색 대상]
- catalog_name : M31, M42 등
- name_en      : Andromeda Galaxy 등
- name_ko      : 안드로메다 은하 등

[필터 기준]
- 전체
- 태양계 : collection_group === "solar_system"
- 별     : type === "star"
- 성단   : type === "cluster"
- 성운   : type === "nebula"
- 은하   : type === "galaxy"

[구현 포인트]
- useMemo를 사용해 검색어나 필터가 변경될 때만 filteredObjects를 재계산
- 검색 결과가 없으면 Empty State 출력
- 필터 초기화 버튼으로 전체 천체 목록으로 복귀 가능
 */

import { useMemo, useState } from "react";
import CelestialCard from "./CelestialCard";

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "solar_system", label: "태양계" },
  { value: "star", label: "별" },
  { value: "cluster", label: "성단" },
  { value: "nebula", label: "성운" },
  { value: "galaxy", label: "은하" },
];

export default function ExploreClient({ objects }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredObjects = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return objects.filter(object => {
      const matchesSearch =
        !keyword ||
        object.catalog_name?.toLowerCase().includes(keyword) ||
        object.name_en?.toLowerCase().includes(keyword) ||
        object.name_ko?.toLowerCase().includes(keyword);

      let matchesFilter = true;

      if (selectedFilter === "solar_system") {
        matchesFilter = object.collection_group === "solar_system";
      }

      if (selectedFilter === "star") {
        matchesFilter = object.type === "star";
      }

      if (selectedFilter === "cluster") {
        matchesFilter = object.type === "cluster";
      }

      if (selectedFilter === "nebula") {
        matchesFilter = object.type === "nebula";
      }

      if (selectedFilter === "galaxy") {
        matchesFilter = object.type === "galaxy";
      }

      return matchesSearch && matchesFilter;
    });
  }, [objects, searchTerm, selectedFilter]);

  return (
    <main className="explore-page">
      <section className="explore-hero">
        <div className="container">
          <p className="section-label">CELESTIAL ARCHIVE</p>

          <h1 className="display-en explore-title">
            Explore
            <br />
            the night sky.
          </h1>

          <p className="explore-description">밤하늘의 천체들을 탐색해보세요.</p>

          <div className="explore-search-wrapper">
            <span className="explore-search-icon">⌕</span>

            <input
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="천체 이름을 검색하세요..."
              className="explore-search"
              aria-label="천체 검색"
            />
          </div>

          <div className="explore-filters">
            {FILTERS.map(filter => (
              <button
                key={filter.value}
                type="button"
                className={selectedFilter === filter.value ? "filter-chip active" : "filter-chip"}
                onClick={() => setSelectedFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="explore-results">
        <div className="container">
          <div className="explore-result-header">
            <span>{filteredObjects.length}개의 천체</span>
          </div>

          {filteredObjects.length > 0 ? (
            <div className="celestial-grid">
              {filteredObjects.map(object => (
                <CelestialCard key={object.id} object={object} />
              ))}
            </div>
          ) : (
            <div className="explore-empty">
              <span>✦</span>

              <h2 className="heading-ko">검색 결과가 없습니다.</h2>

              <p>다른 이름이나 카테고리로 검색해보세요.</p>

              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedFilter("all");
                }}
              >
                전체 천체 보기
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
