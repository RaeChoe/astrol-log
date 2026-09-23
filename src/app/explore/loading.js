export default function ExploreLoading() {
  return (
    <main className="explore-page" aria-busy="true">
      <section className="explore-hero">
        <div className="container">
          <span className="skeleton skeleton-section-label" />

          <div className="explore-title skeleton-title-wrap">
            <div className="skeleton skeleton-title-line skeleton-title-line-first" />
            <div className="skeleton skeleton-title-line skeleton-title-line-second" />
          </div>

          <div className="skeleton skeleton-description" />

          <div className="explore-search-wrapper">
            <div className="skeleton skeleton-search" />
          </div>

          <div className="explore-filters">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`skeleton skeleton-filter skeleton-filter-${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="explore-results">
        <div className="container">
          <div className="explore-results-header">
            <div className="skeleton skeleton-results-count" />

            <div className="skeleton skeleton-observation-guide" />
          </div>

          <div className="celestial-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <article key={index} className="celestial-card skeleton-card">
                <div className="celestial-card-image-wrapper">
                  <div className="skeleton skeleton-card-image" />

                  <div className="skeleton skeleton-card-type" />
                  <div className="skeleton skeleton-card-status" />
                </div>

                <div className="celestial-card-content">
                  <div>
                    <div className="skeleton skeleton-card-catalog" />
                    <div className="skeleton skeleton-card-title" />
                    <div className="skeleton skeleton-card-subtitle" />
                  </div>

                  <div className="celestial-card-meta">
                    <div className="skeleton skeleton-card-meta-left" />
                    <div className="skeleton skeleton-card-meta-right" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
