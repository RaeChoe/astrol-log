export default function CollectionLoading() {
  const groups = [
    {
      titleWidth: "86px",
      cards: 8,
    },
    {
      titleWidth: "170px",
      cards: 8,
    },
    {
      titleWidth: "42px",
      cards: 8,
    },
  ];

  return (
    <main className="collection-page" aria-busy="true">
      {/* ========================================
          HEADER
      ======================================== */}

      <section className="container collection-header">
        <div className="skeleton collection-skeleton-label" />

        <div className="skeleton collection-skeleton-title" />

        {/* ========================================
            OVERALL PROGRESS
        ======================================== */}

        <div className="collection-overall">
          <div className="collection-overall-count">
            <div className="skeleton collection-skeleton-count-label" />

            <div className="collection-skeleton-count">
              <div className="skeleton collection-skeleton-count-main" />

              <div className="skeleton collection-skeleton-count-total" />
            </div>
          </div>

          <div className="collection-overall-progress">
            <div className="collection-overall-progress-head">
              <div className="skeleton collection-skeleton-progress-label" />

              <div className="skeleton collection-skeleton-progress-percent" />
            </div>

            <div className="collection-progress-track">
              <div className="skeleton collection-skeleton-progress-bar" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          COLLECTION GROUPS
      ======================================== */}

      <section className="container collection-groups">
        {groups.map((group, groupIndex) => (
          <section key={groupIndex} className="collection-group">
            <div className="collection-group-header">
              <div>
                <div
                  className="skeleton collection-skeleton-group-title"
                  style={{
                    width: group.titleWidth,
                  }}
                />

                <div className="skeleton collection-skeleton-group-subtitle" />
              </div>

              <div className="skeleton collection-skeleton-group-count" />
            </div>

            <div className="collection-group-grid">
              {Array.from({ length: group.cards }).map((_, index) => (
                <div key={index} className="collection-mini-card collection-skeleton-card">
                  <div className="collection-mini-image">
                    <div className="skeleton collection-skeleton-card-image" />

                    {index % 3 === 0 && <div className="skeleton collection-skeleton-check" />}
                  </div>

                  <div className="collection-mini-content">
                    <div className="skeleton collection-skeleton-card-title" />

                    <div className="skeleton collection-skeleton-card-subtitle" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
