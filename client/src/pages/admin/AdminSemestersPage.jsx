import { useEffect, useState } from "react";
import { semestersApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminSemestersPage() {
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ number: "", name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSemesters = async () => {
    setIsLoading(true);
    try {
      const data = await semestersApi.getAll();
      setSemesters(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load semesters.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await semestersApi.getAll();
        if (isMounted) setSemesters(data);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load semesters.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ number: semesters.length + 1, name: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (semester) => {
    setIsEditing(true);
    setCurrentId(semester._id);
    setFormData({ number: semester.number, name: semester.name });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const num = Number(formData.number);
    if (!num || num < 1) {
      setFormError("Semester number must be at least 1");
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Semester name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await semestersApi.update(currentId, {
          number: num,
          name: formData.name.trim(),
        });
        setSuccessMsg(`Semester ${num} updated successfully.`);
      } else {
        await semestersApi.create({
          number: num,
          name: formData.name.trim(),
        });
        setSuccessMsg(`Semester ${num} created successfully.`);
      }
      setIsModalOpen(false);
      fetchSemesters();
    } catch (err) {
      setFormError(err.response?.data?.message || "An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await semestersApi.delete(deleteTarget._id);
      setSuccessMsg(`Semester ${deleteTarget.number} deleted successfully.`);
      setDeleteTarget(null);
      fetchSemesters();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Cannot delete semester. Ensure all subjects under it are removed first."
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: "Semester",
      key: "number",
      width: "120px",
      render: (row) => <span className="chip-badge">Sem {row.number}</span>,
    },
    {
      title: "Name / Term",
      key: "name",
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      title: "Created At",
      key: "createdAt",
      width: "180px",
      render: (row) => (
        <span className="text-muted">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "150px",
      className: "actions-col",
      render: (row) => (
        <div className="table-actions">
          <button
            className="action-icon-btn"
            title="Edit Semester"
            onClick={() => openEditModal(row)}
          >
            ✎
          </button>
          <button
            className="action-icon-btn delete-btn"
            title="Delete Semester"
            onClick={() => setDeleteTarget(row)}
          >
            🗑
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Academic Structure</span>
          <h1>Manage Semesters</h1>
          <p>Create and organize academic terms for curriculum organization.</p>
        </div>
        <button className="primary-button" onClick={openCreateModal}>
          + Add Semester
        </button>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading semesters…" />
      ) : (
        <DataTable
          columns={columns}
          data={semesters}
          emptyMessage="No semesters found. Click '+ Add Semester' to create your first term."
        />
      )}

      {/* Add / Edit Semester Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={isEditing ? `Edit Semester ${formData.number}` : "Add New Semester"}
        footer={
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Semester"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <AlertBanner message={formError} type="error" onClose={() => setFormError("")} />

          <div className="form-group">
            <label htmlFor="sem-number">Semester Number *</label>
            <input
              id="sem-number"
              type="number"
              min="1"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="e.g. 1"
              required
              disabled={isSubmitting}
            />
            <small className="form-help">Must be a unique positive integer.</small>
          </div>

          <div className="form-group">
            <label htmlFor="sem-name">Semester Name / Label *</label>
            <input
              id="sem-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Semester 1 (Fall 2026)"
              required
              disabled={isSubmitting}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Semester"
        message={`Are you sure you want to delete "${deleteTarget?.name}" (Semester ${deleteTarget?.number})? This action cannot be undone, and will be blocked if subjects are attached.`}
        confirmText="Delete Semester"
        isLoading={isDeleting}
      />
    </div>
  );
}
