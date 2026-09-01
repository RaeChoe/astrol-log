export default function Loading() {
  return (
    <main className="app-loading" aria-live="polite" aria-label="페이지를 불러오는 중">
      <div className="app-loading-inner">
        <span className="app-loading-symbol" aria-hidden="true">
          ✦
        </span>

        <span className="app-loading-text">밤하늘을 불러오는 중</span>

        <div className="app-loading-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </main>
  );
}
