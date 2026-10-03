import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { printHistoryApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const STATUS_CONFIG = {
  printed:   { label: "Printed",   className: "status-success" },
  queued:    { label: "Queued",    className: "status-warning" },
  cancelled: { label: "Cancelled", className: "status-danger"  },
};

export default function StudentPrintHistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await printHistoryApi.getMy();
        if (isMounted) setHistory(data);
      } catch (err) {
        if (isMounted)
          setError(err.response?.data?.message || "Failed to load print history.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const columns = [
    {
      title: "Date",
      key: "printedAt",
      width: "170px",
      render: (row) => (
        <span className="text-muted">{formatDate(row.printedAt)}</span>
      ),
    },
    {
      title: "Document",
      key: "document",
      render: (row) => (
        <div>
          <strong>{row.document?.fileName || "—"}</strong>
          {row.document?.fileSize && (
            <span
              className="file-size-badge"
              style={{ marginLeft: 8 }}
            >
              {(row.document.fileSize / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Experiment",
      key: "experiment",
      width: "130px",
      render: (row) => (
        <div>
          <span className="chip-badge">
            Exp #{row.experiment?.experimentNumber || "?"}
          </span>
          {row.experiment?.title && (
            <p className="table-subtext">{row.experiment.title}</p>
          )}
        </div>
      ),
    },
    {
      title: "Subject",
      key: "subject",
      width: "160px",
      render: (row) => (
        <div>
          <div>{row.subject?.name || "—"}</div>
          {row.subject?.code && (
            <span className="code-badge-sub">{row.subject.code}</span>
          )}
        </div>
      ),
    },
    {
      title: "Semester",
      key: "semester",
      width: "110px",
      render: (row) =>
        row.semester ? (
          <span className="chip-badge">Sem {row.semester.number}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      title: "Pages",
      key: "pageCount",
      width: "80px",
      render: (row) => (
        <span className="pages-badge">
          {row.pageCount > 0 ? row.pageCount : "—"}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: "110px",
      render: (row) => {
        const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.queued;
        return (
          <span className={`status-pill ${cfg.className}`}>{cfg.label}</span>
        );
      },
    },
    {
      title: "View",
      key: "view",
      width: "90px",
      className: "actions-col",
      render: (row) =>
        row.document?._id ? (
          <button
            className="secondary-button-sm"
            onClick={() => navigate(`/student/view/${row.document._id}`)}
            type="button"
          >
            View PDF
          </button>
        ) : null,
    },
  ];

  const totalPages = history.reduce((sum, h) => sum + (h.pageCount || 0), 0);

  return (
    <div className="student-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">My Logs</span>
          <h1>Print History</h1>
          <p>
            A record of every time you logged a document as printed.
          </p>
        </div>
        {history.length > 0 && (
          <div className="date-card">
            <span>Total Pages Printed</span>
            <strong>{totalPages}</strong>
          </div>
        )}
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading print history…" />
      ) : (
        <DataTable
          columns={columns}
          data={history}
          emptyMessage="You have not logged any print jobs yet. Open a document in the viewer and click 'Log as Printed'."
        />
      )}
    </div>
  );
}
