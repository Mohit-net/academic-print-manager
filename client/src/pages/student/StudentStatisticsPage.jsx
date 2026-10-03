import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { printHistoryApi, documentsApi, experimentsApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function StudentStatisticsPage() {
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [totalExperiments, setTotalExperiments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [hist, docs, exps] = await Promise.all([
          printHistoryApi.getMy(),
          documentsApi.getMyDocuments(),
          experimentsApi.getAll().catch(() => []),
        ]);
        if (isMounted) {
          setHistory(hist);
          setDocuments(docs);
          setTotalExperiments(exps.length);
        }
      } catch (err) {
        if (isMounted)
          setError(err.response?.data?.message || "Failed to load statistics.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Aggregate print stats per subject
  const subjectStats = {};
  for (const entry of history) {
    const key = entry.subject?._id || "unknown";
    const name = entry.subject?.name || "Unknown Subject";
    if (!subjectStats[key]) {
      subjectStats[key] = { name, totalPages: 0, printCount: 0 };
    }
    subjectStats[key].totalPages += entry.pageCount || 0;
    subjectStats[key].printCount += 1;
  }
  const subjectRows = Object.values(subjectStats).sort(
    (a, b) => b.totalPages - a.totalPages
  );
  const maxPages = subjectRows[0]?.totalPages || 1;

  const totalPages = history.reduce((s, h) => s + (h.pageCount || 0), 0);
  const completion =
    totalExperiments > 0
      ? Math.round((documents.length / totalExperiments) * 100)
      : 0;

  return (
    <div className="student-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">My Analytics</span>
          <h1>Statistics</h1>
          <p>An overview of your academic activity and print usage.</p>
        </div>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading your statistics…" />
      ) : (
        <>
          {/* Summary metrics */}
          <section className="stats-grid">
            <div className="metric-card static-card">
              <div className="metric-header">
                <span className="card-icon">▤</span>
                <span className="metric-label">Documents Uploaded</span>
              </div>
              <div className="metric-value">{documents.length}</div>
              <span className="metric-footer">
                {completion}% of curriculum complete
              </span>
            </div>

            <div className="metric-card static-card">
              <div className="metric-header">
                <span className="card-icon">◷</span>
                <span className="metric-label">Total Print Jobs</span>
              </div>
              <div className="metric-value">{history.length}</div>
              <span className="metric-footer">Logged via the PDF viewer</span>
            </div>

            <div className="metric-card static-card">
              <div className="metric-header">
                <span className="card-icon">◈</span>
                <span className="metric-label">Total Pages Printed</span>
              </div>
              <div className="metric-value">{totalPages}</div>
              <span className="metric-footer">Across all subjects</span>
            </div>
          </section>

          {/* Pages per subject breakdown */}
          <section className="section-panel">
            <div className="section-panel-header">
              <div>
                <h2>Pages Printed by Subject</h2>
                <p>Breakdown of print volume across your subjects</p>
              </div>
            </div>

            {subjectRows.length === 0 ? (
              <div className="table-empty">
                <span className="empty-icon">◈</span>
                <p>
                  No print data yet. Open a document in the viewer and click
                  &ldquo;Log as Printed&rdquo; to start tracking.
                </p>
                <Link
                  to="/student/documents"
                  className="primary-button-sm"
                  style={{ marginTop: "12px" }}
                >
                  Go to My Documents
                </Link>
              </div>
            ) : (
              subjectRows.map((row) => (
                <div key={row.name} className="stat-bar-row">
                  <span className="stat-bar-label">{row.name}</span>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${Math.round((row.totalPages / maxPages) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="stat-bar-value">
                    {row.totalPages} pg
                  </span>
                  <span className="text-muted" style={{ fontSize: 12, minWidth: 60 }}>
                    {row.printCount} job{row.printCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
