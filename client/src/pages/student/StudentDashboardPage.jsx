import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { documentsApi, experimentsApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { requestNotificationPermission, getNotificationPermission } from "../../utils/notifications";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [totalExperiments, setTotalExperiments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(
    () => localStorage.getItem("notif-banner-dismissed") === "true"
  );

  useEffect(() => {
    const fetchStudentData = async () => {      setIsLoading(true);
      setError("");
      try {
        const [docs, exps] = await Promise.all([
          documentsApi.getMyDocuments(),
          experimentsApi.getAll().catch(() => []),
        ]);
        setDocuments(docs);
        setTotalExperiments(exps.length);
      } catch (err) {
        console.error("Student dashboard data error:", err);
        setError("Unable to load overview data. Please try refreshing.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Don't silently request permission — show the banner instead so the
  // browser prompt is triggered by an actual user gesture (button click).
  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result === "granted" || result === "denied") {
      localStorage.setItem("notif-banner-dismissed", "true");
      setNotifBannerDismissed(true);
    }
  };

  const handleDismissBanner = () => {
    localStorage.setItem("notif-banner-dismissed", "true");
    setNotifBannerDismissed(true);
  };

  const handleViewPdf = (doc) => {
    navigate(`/student/view/${doc._id}`);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="dashboard-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Student Dashboard</span>
          <h1>My Academic Workspace</h1>
          <p>
            Welcome, {user?.name}. Manage and review your laboratory experiment PDFs in
            one central place.
          </p>
        </div>
        <div className="date-card">
          <span>Student Account</span>
          <strong>
            <i /> Active
          </strong>
        </div>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />

      {/* Notification permission banner — shown once if permission not yet decided */}
      {"Notification" in window &&
        getNotificationPermission() === "default" &&
        !notifBannerDismissed && (
          <div className="notif-banner">
            <span className="notif-banner-icon">🔔</span>
            <div className="notif-banner-text">
              <strong>Enable notifications</strong>
              <span>Get notified when your PDF uploads complete successfully.</span>
            </div>
            <div className="notif-banner-actions">
              <button
                className="primary-button-sm"
                onClick={handleEnableNotifications}
                type="button"
              >
                Enable
              </button>
              <button
                className="secondary-button-sm"
                onClick={handleDismissBanner}
                type="button"
              >
                Not now
              </button>
            </div>
          </div>
        )}

      {isLoading ? (
        <LoadingSpinner text="Loading your academic documents…" />
      ) : (
        <>
          {/* Metrics */}
          <section className="metrics-grid">
            <Link to="/student/documents" className="metric-card">
              <div className="metric-header">
                <span className="card-icon">▤</span>
                <span className="metric-label">My Documents</span>
              </div>
              <div className="metric-value">{documents.length}</div>
              <span className="metric-footer">Uploaded experiment PDFs →</span>
            </Link>

            <Link to="/student/experiments" className="metric-card">
              <div className="metric-header">
                <span className="card-icon">⌁</span>
                <span className="metric-label">Total Experiments</span>
              </div>
              <div className="metric-value">{totalExperiments}</div>
              <span className="metric-footer">Available in curriculum →</span>
            </Link>

            <div className="metric-card static-card">
              <div className="metric-header">
                <span className="card-icon">◈</span>
                <span className="metric-label">Completion Status</span>
              </div>
              <div className="metric-value">
                {totalExperiments > 0
                  ? `${Math.round((documents.length / totalExperiments) * 100)}%`
                  : "0%"}
              </div>
              <span className="metric-footer">
                {documents.length} of {totalExperiments} experiments uploaded
              </span>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="section-panel">
            <div className="section-panel-header">
              <div>
                <h2>Quick Navigation</h2>
                <p>Access your curriculum and uploaded coursework</p>
              </div>
            </div>
            <div className="quick-actions-bar">
              <Link to="/student/experiments" className="action-pill primary-pill">
                <span>⌁</span> Browse Experiments to Upload
              </Link>
              <Link to="/student/documents" className="action-pill">
                <span>▤</span> Manage My Documents
              </Link>
            </div>
          </section>

          {/* Recent Uploads */}
          <section className="section-panel">
            <div className="section-panel-header">
              <div>
                <h2>Recently Uploaded Documents</h2>
                <p>Your latest laboratory reports</p>
              </div>
              <Link to="/student/documents" className="secondary-button-sm">
                View All
              </Link>
            </div>

            {documents.length === 0 ? (
              <div className="table-empty">
                <span className="empty-icon">▤</span>
                <p>You haven't uploaded any experiment PDFs yet.</p>
                <Link
                  to="/student/experiments"
                  className="primary-button-sm"
                  style={{ marginTop: "12px" }}
                >
                  Browse Experiments & Upload
                </Link>
              </div>
            ) : (
              <div className="recent-docs-list">
                {documents.slice(0, 4).map((doc) => (
                  <div key={doc._id} className="recent-doc-row">
                    <div className="doc-meta">
                      <span className="file-icon">📄</span>
                      <div>
                        <strong>{doc.fileName}</strong>
                        <p>
                          Exp #{doc.experiment?.experimentNumber} •{" "}
                          {doc.experiment?.subject?.name || "Subject"}
                        </p>
                      </div>
                    </div>
                    <div className="doc-actions-side">
                      <span className="file-size-badge">
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <button
                        className="secondary-button-sm"
                        onClick={() => handleViewPdf(doc)}
                      >
                        View PDF ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
