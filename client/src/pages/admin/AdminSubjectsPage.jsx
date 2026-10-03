import { useEffect, useState } from "react";
import { semestersApi, subjectsApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", semester: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await subjectsApi.getAll(selectedSemester || undefined);
      setSubjects(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load subjects.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [sems, subjs] = await Promise.all([
          semestersApi.getAll(),
          subjectsApi.getAll(selectedSemester || undefined),
        ]);
        if (isMounted) {
          setSemesters(sems);
          setSubjects(subjs);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load subjects.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedSemester]);

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: "",
      code: "",
      semester: selectedSemester || (semesters[0]?._id || ""),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setIsEditing(true);
    setCurrentId(subject._id);
    setFormData({
      name: subject.name,
      code: subject.code || "",
      semester: subject.semester?._id || subject.semester || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Subject name is required");
      return;
    }
    if (!formData.semester) {
      setFormError("Please select a semester");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || undefined,
        semester: formData.semester,
      };

      if (isEditing) {
        await subjectsApi.update(currentId, payload);
        setSuccessMsg(`Subject "${payload.name}" updated successfully.`);
      } else {
        await subjectsApi.create(payload);
        setSuccessMsg(`Subject "${payload.name}" created successfully.`);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save subject.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await subjectsApi.delete(deleteTarget._id);
      setSuccessMsg(`Subject "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      fetchSubjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Cannot delete subject. Remove all attached experiments first."
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: "Code",
      key: "code",
      width: "120px",
      render: (row) =>
        row.code ? (
          <span className="code-badge">{row.code}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      title: "Subject Name",
      key: "name",
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      title: "Semester",
      key: "semester",
      width: "150px",
      render: (row) => (
        <span className="chip-badge">
          Sem {row.semester?.number || "?"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "140px",
      className: "actions-col",
      render: (row) => (
        <div className="table-actions">
          <button
            className="action-icon-btn"
            title="Edit Subject"
            onClick={() => openEditModal(row)}
          >
            ✎
          </button>
          <button
            className="action-icon-btn delete-btn"
            title="Delete Subject"
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
          <h1>Manage Subjects</h1>
          <p>Organize courses and modules within each semester.</p>
        </div>
        <button
          className="primary-button"
          onClick={openCreateModal}
          disabled={semesters.length === 0}
          title={
            semesters.length === 0
              ? "Create a semester first before adding subjects"
              : undefined
          }
        >
          + Add Subject
        </button>
      </section>

      {/* Filter Bar */}
      <section className="filter-bar">
        <div className="filter-group">
          <label htmlFor="filter-sem">Filter by Semester:</label>
          <select
            id="filter-sem"
            className="form-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">All Semesters ({semesters.length})</option>
            {semesters.map((sem) => (
              <option key={sem._id} value={sem._id}>
                Semester {sem.number}: {sem.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading subjects…" />
      ) : (
        <DataTable
          columns={columns}
          data={subjects}
          emptyMessage={
            semesters.length === 0
              ? "No semesters created yet. Please create a semester first."
              : selectedSemester
              ? "No subjects found for this semester. Click '+ Add Subject' to add one."
              : "No subjects found across all semesters. Click '+ Add Subject' to begin."
          }
        />
      )}

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={isEditing ? `Edit Subject: ${formData.name}` : "Add New Subject"}
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
              {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Subject"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <AlertBanner message={formError} type="error" onClose={() => setFormError("")} />

          <div className="form-group">
            <label htmlFor="subj-semester">Semester *</label>
            <select
              id="subj-semester"
              className="form-select"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              required
              disabled={isSubmitting}
            >
              <option value="">Select a Semester</option>
              {semesters.map((sem) => (
                <option key={sem._id} value={sem._id}>
                  Semester {sem.number} — {sem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subj-name">Subject Name *</label>
            <input
              id="subj-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Data Structures & Algorithms"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="subj-code">Subject Code (Optional)</label>
            <input
              id="subj-code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CS201"
              disabled={isSubmitting}
            />
            <small className="form-help">Unique uppercase course code if applicable.</small>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All attached experiments must be removed before deleting.`}
        confirmText="Delete Subject"
        isLoading={isDeleting}
      />
    </div>
  );
}
