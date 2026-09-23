export default function ObservationDetailLoading() {
  return (
    <main className="observation-detail-page" aria-busy="true">
      <div className="container observation-detail-container">
        <div className="skeleton detail-skeleton-back" />

        <section className="observation-detail-header">
          <div className="skeleton detail-skeleton-catalog" />
          <div className="skeleton detail-skeleton-title" />
          <div className="skeleton detail-skeleton-subtitle" />

          <div className="observation-detail-actions">
            <div className="skeleton detail-skeleton-button" />
            <div className="skeleton detail-skeleton-button detail-skeleton-button-small" />
          </div>
        </section>

        <section className="observation-gallery-section">
          <div className="observation-gallery-heading">
            <div className="skeleton detail-skeleton-gallery-label" />
            <div className="skeleton detail-skeleton-gallery-count" />
          </div>

          <div className="observation-gallery observation-gallery-3">
            <div className="observation-gallery-item">
              <div className="skeleton detail-skeleton-gallery-image" />
            </div>

            <div className="observation-gallery-item">
              <div className="skeleton detail-skeleton-gallery-image" />
            </div>

            <div className="observation-gallery-item">
              <div className="skeleton detail-skeleton-gallery-image" />
            </div>
          </div>
        </section>

        <section className="observation-detail-grid">
          <div className="observation-detail-info">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="observation-info-item">
                <div className="skeleton detail-skeleton-info-label" />
                <div className="skeleton detail-skeleton-info-value" />
              </div>
            ))}
          </div>

          <article className="observation-note-card">
            <div className="skeleton detail-skeleton-note-label" />

            <div className="detail-skeleton-note-lines">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton short" />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
