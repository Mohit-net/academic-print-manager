import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { documentsApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import DataTable from "../../components/common/DataTable";
import ConfirmModal from "../../components/common/ConfirmModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  // Action states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await documentsApi.getMyDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your documents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await documentsApi.getMyDocuments();
        if (isMounted) setDocuments(data);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load your documents.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewPdf = (doc) => {
    navigate(`/student/view/${doc._id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await documentsApi.delete(deleteTarget._id);
      setSuccessMsg(`Document "${deleteTarget.fileName}" deleted successfully.`);
      setDeleteTarget(null);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete document.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const columns = [
    {
      title: "Document",
      key: "fileName",
      render: (row) => (
        <div className="doc-table-cell">
          <span className="file-icon">📄</span>
          <div>
            <strong>{row.fileName}</strong>
            <span className="file-size-badge">{formatFileSize(row.fileSize)}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Experiment",
      key: "experiment",
      render: (row) => (
        <div>
          <span className="chip-badge">
            Exp #{row.experiment?.experimentNumber || "?"}
          </span>
          <span style={{ marginLeft: "8px" }}>
            {row.experiment?.title || "Lab Experiment"}
          </span>
        </div>
      ),
    },
    {
      title: "Subject / Semester",
      key: "subject",
      width: "200px",
      render: (row) => {
        const subj = row.experiment?.subject;
        const sem = subj?.semester;
        return (
          <div>
            <div>{subj?.name || "—"}</div>
            {sem && <small className="text-muted">Semester {sem.number}</small>}
          </div>
        );
      },
    },
    {
      title: "Uploaded Date",
      key: "createdAt",
      width: "140px",
      render: (row) => (
        <span className="text-muted">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "160px",
      className: "actions-col",
      render: (row) => (
        <div className="table-actions">
          <button
            className="secondary-button-sm"
            onClick={() => handleViewPdf(row)}
            title="Open PDF Preview"
          >
            View PDF
          </button>
          <button
            className="action-icon-btn delete-btn"
            title="Delete Document"
            onClick={() => setDeleteTarget(row)}
          >
            🗑
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="student-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">My Files</span>
          <h1>My Uploaded Documents</h1>
          <p>
            Review, inspect, or delete your active experiment PDFs. Each experiment allows
            one active document.
          </p>
        </div>
        <Link to="/student/experiments" className="primary-button">
          + Upload More Documents
        </Link>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading your documents…" />
      ) : (
        <DataTable
          columns={columns}
          data={documents}
          emptyMessage="You have not uploaded any experiment PDFs yet. Browse experiments to upload your first document."
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.fileName}"? The file will be permanently removed from Google Drive and your account. You will then be able to upload a new document for this experiment.`}
        confirmText="Delete Document"
        isLoading={isDeleting}
      />
    </div>
  );
}
