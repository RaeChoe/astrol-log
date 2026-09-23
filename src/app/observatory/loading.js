export default function ObservatoryLoading() {
  return (
    <main className="observatory-page" aria-busy="true">
      <section className="container observatory-profile-section">
        <div className="observatory-profile-form">
          <div className="observatory-profile-avatar-area">
            <div className="skeleton observatory-skeleton-avatar" />
          </div>

          <div className="observatory-profile-info">
            <div className="skeleton observatory-skeleton-profile-label" />
            <div className="skeleton observatory-skeleton-name" />
            <div className="skeleton observatory-skeleton-profile-text" />
          </div>

          <div className="observatory-profile-actions">
            <div className="skeleton observatory-skeleton-profile-button" />
          </div>
        </div>

        <div className="observatory-profile-subinfo">
          <div className="skeleton observatory-skeleton-subinfo-wide" />
          <div className="skeleton observatory-skeleton-subinfo" />
          <div className="skeleton observatory-skeleton-subinfo" />
        </div>
      </section>

      <section className="container observatory-section">
        <div className="observatory-section-header">
          <div>
            <div className="skeleton observatory-skeleton-section-label" />
            <div className="skeleton observatory-skeleton-section-title" />
          </div>
        </div>

        <div className="observatory-stat-grid">
          {Array.from({ length: 5 }).map((_, index) => (
            <article key={index} className="observatory-stat-card">
              <div className="skeleton observatory-skeleton-stat-label" />

              <div className="observatory-skeleton-stat-value-row">
                <div className="skeleton observatory-skeleton-stat-value" />
                <div className="skeleton observatory-skeleton-stat-unit" />
              </div>
            </article>
          ))}
        </div>

        <div className="observatory-progress-card">
          <div className="observatory-progress-heading">
            <div>
              <div className="skeleton observatory-skeleton-progress-label" />
              <div className="skeleton observatory-skeleton-progress-title" />
            </div>

            <div className="skeleton observatory-skeleton-progress-percent" />
          </div>

          <div className="observatory-progress-track">
            <div className="skeleton observatory-skeleton-progress-bar" />
          </div>

          <div className="observatory-progress-footer">
            <div className="skeleton observatory-skeleton-progress-footer" />
            <div className="skeleton observatory-skeleton-progress-link" />
          </div>
        </div>
      </section>

      <section className="container observatory-chart-section">
        <div className="observatory-section-header">
          <div>
            <div className="skeleton observatory-skeleton-section-label" />
            <div className="skeleton observatory-skeleton-section-title" />
          </div>

          <div className="skeleton observatory-skeleton-year" />
        </div>

        <div className="observatory-chart-card">
          <div className="observatory-chart-top">
            <div>
              <div className="skeleton observatory-skeleton-chart-label" />
              <div className="skeleton observatory-skeleton-chart-count" />
            </div>
          </div>

          <div className="observatory-month-chart">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="observatory-month-item">
                <div className="observatory-month-bar-area">
                  <div
                    className="skeleton observatory-skeleton-month-bar"
                    style={{
                      height: `${30 + ((index * 17) % 65)}%`,
                    }}
                  />
                </div>

                <div className="skeleton observatory-skeleton-month-label" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container observatory-library-section">
        <LibrarySkeleton />
        <LibrarySkeleton />
      </section>
    </main>
  );
}

function LibrarySkeleton() {
  return (
    <div className="observatory-library-column">
      <div className="observatory-library-heading">
        <div>
          <div className="skeleton observatory-skeleton-section-label" />
          <div className="skeleton observatory-skeleton-library-title" />
        </div>

        <div className="skeleton observatory-skeleton-library-link" />
      </div>

      <div className="observatory-compact-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="observatory-compact-item">
            <div className="observatory-compact-image">
              <div className="skeleton observatory-skeleton-compact-image" />
            </div>

            <div className="observatory-compact-content">
              <div className="skeleton observatory-skeleton-compact-title" />
              <div className="skeleton observatory-skeleton-compact-meta" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
