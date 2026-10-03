import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  semestersApi,
  subjectsApi,
  experimentsApi,
  studentsApi,
} from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    semesters: 0,
    subjects: 0,
    experiments: 0,
    students: 0,
  });
  const [recentSemesters, setRecentSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [semesters, subjects, experiments, students] = await Promise.all([
          semestersApi.getAll(),
          subjectsApi.getAll(),
          experimentsApi.getAll(),
          studentsApi.getAll().catch(() => []),
        ]);

        setCounts({
          semesters: semesters.length,
          subjects: subjects.length,
          experiments: experiments.length,
          students: students.length,
        });

        setRecentSemesters(semesters.slice(0, 5));
      } catch (err) {
        console.error("Dashboard data load error:", err);
        setError("Unable to load overview statistics. Please try refreshing.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Admin Dashboard</span>
          <h1>Academic Management Overview</h1>
          <p>
            Welcome back, {user?.name}. Manage your institution's academic structure
            and student accounts.
          </p>
        </div>
        <div className="date-card">
          <span>Workspace status</span>
          <strong>
            <i /> Live & Connected
          </strong>
        </div>
      </section>

      <AlertBanner message={error} onClose={() => setError("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading academic overview…" />
      ) : (
        <>
          {/* Quick Metrics */}
          <section className="metrics-grid">
            <Link to="/admin/semesters" className="metric-card">
              <div className="metric-header">
                <span className="card-icon">◌</span>
                <span className="metric-label">Semesters</span>
              </div>
              <div className="metric-value">{counts.semesters}</div>
              <span className="metric-footer">View and manage semesters →</span>
            </Link>

            <Link to="/admin/subjects" className="metric-card">
              <div className="metric-header">
                <span className="card-icon">▣</span>
                <span className="metric-label">Subjects</span>
              </div>
              <div className="metric-value">{counts.subjects}</div>
              <span className="metric-footer">Organized across semesters →</span>
            </Link>

            <Link to="/admin/experiments" className="metric-card">
              <div className="metric-header">
                <span className="card-icon">⌁</span>
                <span className="metric-label">Experiments</span>
              </div>
              <div className="metric-value">{counts.experiments}</div>
              <span className="metric-footer">Curriculum lab experiments →</span>
            </Link>

            <Link to="/admin/students" className="metric-card">
              <div className="metric-header">
                <span className="card-icon">◉</span>
                <span className="metric-label">Students</span>
              </div>
              <div className="metric-value">{counts.students}</div>
              <span className="metric-footer">Registered student accounts →</span>
            </Link>

            <Link to="/admin/statistics" className="metric-card">
              <div className="metric-header">
                <span className="card-icon">◈</span>
                <span className="metric-label">Statistics</span>
              </div>
              <div className="metric-value">Analytics</div>
              <span className="metric-footer">Print usage & activity →</span>
            </Link>
          </section>

          {/* Quick Action Shortcuts */}
          <section className="section-panel">
            <div className="section-panel-header">
              <div>
                <h2>Quick Actions</h2>
                <p>Fast access to manage your curriculum and accounts</p>
              </div>
            </div>
            <div className="quick-actions-bar">
              <Link to="/admin/semesters" className="action-pill">
                <span>+</span> Add Semester
              </Link>
              <Link to="/admin/subjects" className="action-pill">
                <span>+</span> Add Subject
              </Link>
              <Link to="/admin/experiments" className="action-pill">
                <span>+</span> Add Experiment
              </Link>
              <Link to="/admin/students" className="action-pill">
                <span>+</span> Register Student
              </Link>
              <Link to="/admin/statistics" className="action-pill">
                <span>◈</span> View Statistics
              </Link>
            </div>
          </section>

          {/* Structure Overview */}
          <section className="section-panel">
            <div className="section-panel-header">
              <div>
                <h2>Configured Semesters</h2>
                <p>Current academic terms in the system</p>
              </div>
              <Link to="/admin/semesters" className="secondary-button-sm">
                Manage All
              </Link>
            </div>

            {recentSemesters.length === 0 ? (
              <div className="table-empty">
                <span className="empty-icon">◌</span>
                <p>No semesters created yet. Get started by creating Semester 1.</p>
                <Link to="/admin/semesters" className="primary-button-sm" style={{ marginTop: "12px" }}>
                  Create First Semester
                </Link>
              </div>
            ) : (
              <div className="chips-grid">
                {recentSemesters.map((sem) => (
                  <div key={sem._id} className="structure-chip">
                    <span className="chip-badge">Sem {sem.number}</span>
                    <span className="chip-title">{sem.name}</span>
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
