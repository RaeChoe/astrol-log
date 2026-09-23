export default function EditObservationLoading() {
  return (
    <main className="observation-editor-page" aria-busy="true">
      <div className="container observation-editor-container">
        <div className="skeleton editor-skeleton-back" />

        <div className="observation-editor-header">
          <div className="skeleton editor-skeleton-label" />
          <div className="skeleton editor-skeleton-title" />
          <div className="skeleton editor-skeleton-description" />
        </div>

        <ObservationFormSkeleton />
      </div>
    </main>
  );
}

function ObservationFormSkeleton() {
  return (
    <div className="observation-form editor-skeleton-form">
      <div className="observation-field">
        <div className="skeleton editor-skeleton-field-label" />
        <div className="skeleton editor-skeleton-select" />
      </div>

      <div className="observation-target-card editor-skeleton-target">
        <div className="observation-target-image">
          <div className="skeleton editor-skeleton-target-image" />
        </div>

        <div className="observation-target-content">
          <div className="skeleton editor-skeleton-target-label" />
          <div className="skeleton editor-skeleton-target-title" />
          <div className="skeleton editor-skeleton-target-text" />
        </div>
      </div>

      <div className="observation-field">
        <div className="skeleton editor-skeleton-field-label" />

        <div className="observation-datetime-grid">
          <div className="skeleton editor-skeleton-input" />
          <div className="skeleton editor-skeleton-input" />
        </div>
      </div>

      <div className="observation-field">
        <div className="skeleton editor-skeleton-field-label" />
        <div className="skeleton editor-skeleton-input" />
      </div>

      <div className="observation-field">
        <div className="skeleton editor-skeleton-field-label" />
        <div className="skeleton editor-skeleton-select" />
      </div>

      <div className="observation-field">
        <div className="skeleton editor-skeleton-field-label" />
        <div className="skeleton editor-skeleton-rating" />
      </div>

      <div className="observation-field">
        <div className="skeleton editor-skeleton-field-label" />
        <div className="skeleton editor-skeleton-input editor-skeleton-duration" />
      </div>

      <div className="observation-field">
        <div className="skeleton editor-skeleton-field-label" />
        <div className="skeleton editor-skeleton-textarea" />
      </div>

      <div className="observation-field">
        <div className="skeleton editor-skeleton-field-label" />
        <div className="skeleton editor-skeleton-upload" />
      </div>

      <div className="observation-form-actions">
        <div className="skeleton editor-skeleton-action" />
        <div className="skeleton editor-skeleton-action editor-skeleton-action-primary" />
      </div>
    </div>
  );
}
