export default function ObservationsLoading() {
  return (
    <main className="observations-page" aria-busy="true">
      <section className="container observations-design-header">
        <div className="skeleton observations-skeleton-label" />

        <div className="observations-title-row">
          <div>
            <div className="skeleton observations-skeleton-title" />
            <div className="skeleton observations-skeleton-description" />
          </div>

          <div className="skeleton observations-skeleton-new-button" />
        </div>

        <div className="observations-filter-list">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className={`skeleton observations-skeleton-filter observations-skeleton-filter-${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="container observations-records">
        <section className="observation-month-group">
          <div className="skeleton observations-skeleton-month" />

          <div className="observation-record-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <article key={index} className="observation-record-card observations-skeleton-record">
                <div className="observation-record-date">
                  <div className="skeleton observations-skeleton-day" />
                  <div className="skeleton observations-skeleton-month-short" />
                </div>

                <div className="observation-record-thumbnail">
                  <div className="skeleton observations-skeleton-thumbnail" />
                </div>

                <div className="observation-record-main">
                  <div className="observation-record-title">
                    <div className="skeleton observations-skeleton-record-title" />
                    <div className="skeleton observations-skeleton-record-subtitle" />
                  </div>

                  <div className="observation-record-meta">
                    <div className="skeleton observations-skeleton-meta-wide" />
                    <div className="skeleton observations-skeleton-meta" />
                    <div className="skeleton observations-skeleton-meta-stars" />
                  </div>

                  <div className="skeleton observations-skeleton-note" />
                </div>

                <div className="skeleton observations-skeleton-arrow" />
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
