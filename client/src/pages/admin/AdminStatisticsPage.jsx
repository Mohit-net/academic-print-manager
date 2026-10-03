import { useEffect, useState } from "react";
import { printHistoryApi, documentsApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await printHistoryApi.getAdminStats();
        if (isMounted) setStats(data);
      } catch (err) {
        if (isMounted)
          setError(err.response?.data?.message || "Failed to load statistics.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Loading statistics…" />;
  }

  const { totals, recent, dailyActivity, topSubjects, topStudents } = stats || {};

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Analytics</span>
          <h1>Statistics</h1>
          <p>System-wide usage overview and activity metrics.</p>
        </div>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🖨</span>
          <div className="stat-content">
            <span className="stat-value">{totals?.prints ?? 0}</span>
            <span className="stat-label">Total Prints</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📄</span>
          <div className="stat-content">
            <span className="stat-value">{totals?.pages?.toLocaleString() ?? 0}</span>
            <span className="stat-label">Pages Printed</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📁</span>
          <div className="stat-content">
            <span className="stat-value">{totals?.documents ?? 0}</span>
            <span className="stat-label">Documents Uploaded</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-value">{totals?.printStudents ?? 0}</span>
            <span className="stat-label">Students Who Printed</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-content">
            <span className="stat-value">{recent?.printsLast7Days ?? 0}</span>
            <span className="stat-label">Prints (Last 7 Days)</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⬆</span>
          <div className="stat-content">
            <span className="stat-value">{recent?.documentsLast7Days ?? 0}</span>
            <span className="stat-label">Uploads (Last 7 Days)</span>
          </div>
        </div>
      </div>

      {/* Daily Activity */}
      {dailyActivity?.length > 0 && (
        <div className="section-panel" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Print Activity (Last 7 Days)</h3>
          <div className="activity-chart">
            {dailyActivity.map((day) => (
              <div key={day._id} className="activity-bar-container">
                <div
                  className="activity-bar"
                  style={{
                    height: `${Math.min(100, (day.printCount / Math.max(...dailyActivity.map(d => d.printCount))) * 100)}%`,
                  }}
                  title={`${day.printCount} prints (${day.pageCount} pages)`}
                />
                <span className="activity-label">
                  {new Date(day._id).toLocaleDateString("en-IN", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Subjects & Students */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Top Subjects */}
        <div className="section-panel">
          <h3 style={{ marginBottom: 16 }}>Top Subjects by Prints</h3>
          {topSubjects?.length > 0 ? (
            <div className="top-list">
              {topSubjects.map((item, idx) => (
                <div key={item.subjectId} className="top-list-item">
                  <span className="top-rank">#{idx + 1}</span>
                  <div className="top-info">
                    <strong>{item.subjectName}</strong>
                    <small>{item.subjectCode}</small>
                  </div>
                  <div className="top-stats">
                    <span>{item.printCount} prints</span>
                    <span className="text-muted">{item.pageCount} pages</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No print data yet.</p>
          )}
        </div>

        {/* Top Students */}
        <div className="section-panel">
          <h3 style={{ marginBottom: 16 }}>Top Students by Prints</h3>
          {topStudents?.length > 0 ? (
            <div className="top-list">
              {topStudents.map((item, idx) => (
                <div key={item.studentId} className="top-list-item">
                  <span className="top-rank">#{idx + 1}</span>
                  <div className="top-info">
                    <strong>{item.studentName}</strong>
                    <small>{item.studentEmail}</small>
                  </div>
                  <div className="top-stats">
                    <span>{item.printCount} prints</span>
                    <span className="text-muted">{item.pageCount} pages</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No print data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}