export default function ObjectDetailLoading() {
  return (
    <main className="object-detail-page" aria-busy="true">
      <section className="object-hero">
        <div className="skeleton object-skeleton-hero-image" />

        <div className="object-hero-overlay" />

        <div className="container object-hero-inner">
          <div className="skeleton object-skeleton-back" />
        </div>
      </section>

      <section className="object-main-section">
        <div className="container">
          <div className="object-main-grid">
            <div className="object-main-content">
              <div className="skeleton object-skeleton-catalog" />
              <div className="skeleton object-skeleton-title" />
              <div className="skeleton object-skeleton-name-ko" />

              <div className="object-main-tags">
                <div className="skeleton object-skeleton-chip" />
                <div className="skeleton object-skeleton-distance" />
              </div>

              <div className="object-skeleton-description">
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton short" />
              </div>
            </div>

            <aside className="object-info-panel">
              <div className="skeleton object-skeleton-info-heading" />

              <div className="object-info-list">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index}>
                    <div className="skeleton object-skeleton-info-label" />
                    <div className="skeleton object-skeleton-info-value" />
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <section className="object-observation-area">
            <div className="skeleton object-skeleton-sub-label" />

            <div className="object-observation-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="object-observation-card">
                  <div className="skeleton object-skeleton-observation-label" />
                  <div className="skeleton object-skeleton-observation-value" />
                </div>
              ))}
            </div>

            <div className="skeleton object-skeleton-notice" />
          </section>

          <section className="object-personal-card">
            <div className="object-personal-content">
              <div className="skeleton object-skeleton-personal-label" />
              <div className="skeleton object-skeleton-personal-title" />
              <div className="skeleton object-skeleton-personal-text" />
              <div className="skeleton object-skeleton-personal-link" />
            </div>

            <div className="object-personal-preview">
              <div className="skeleton object-skeleton-preview" />
            </div>
          </section>

          <div className="object-bottom-actions">
            <div className="skeleton object-skeleton-main-button" />
            <div className="skeleton object-skeleton-favorite-button" />
          </div>
        </div>
      </section>
    </main>
  );
}
