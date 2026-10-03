import { useEffect, useState } from "react";
import { semestersApi, subjectsApi, experimentsApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminExperimentsPage() {
  const [experiments, setExperiments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    experimentNumber: "",
    title: "",
    description: "",
    subject: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExperiments = async () => {
    setIsLoading(true);
    try {
      const data = await experimentsApi.getAll(selectedSubject || undefined);
      if (selectedSemester && !selectedSubject) {
        const semesterSubjectIds = new Set(
          subjects
            .filter((s) => (s.semester?._id || s.semester) === selectedSemester)
            .map((s) => s._id)
        );
        setExperiments(
          data.filter((exp) =>
            semesterSubjectIds.has(exp.subject?._id || exp.subject)
          )
        );
      } else {
        setExperiments(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load experiments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [sems, subjs, exps] = await Promise.all([
          semestersApi.getAll(),
          subjectsApi.getAll(),
          experimentsApi.getAll(selectedSubject || undefined),
        ]);
        if (isMounted) {
          setSemesters(sems);
          setSubjects(subjs);

          if (selectedSemester && !selectedSubject) {
            const semesterSubjectIds = new Set(
              subjs
                .filter((s) => (s.semester?._id || s.semester) === selectedSemester)
                .map((s) => s._id)
            );
            setExperiments(
              exps.filter((exp) =>
                semesterSubjectIds.has(exp.subject?._id || exp.subject)
              )
            );
          } else {
            setExperiments(exps);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load experiments.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedSemester, selectedSubject]);

  // Filter subjects available based on selected semester
  const filteredSubjectsForSelect = selectedSemester
    ? subjects.filter((s) => (s.semester?._id || s.semester) === selectedSemester)
    : subjects;

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      experimentNumber: experiments.length + 1,
      title: "",
      description: "",
      subject: selectedSubject || (subjects[0]?._id || ""),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (experiment) => {
    setIsEditing(true);
    setCurrentId(experiment._id);
    setFormData({
      experimentNumber: experiment.experimentNumber,
      title: experiment.title || "",
      description: experiment.description || "",
      subject: experiment.subject?._id || experiment.subject || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const expNum = Number(formData.experimentNumber);
    if (!expNum || expNum < 1) {
      setFormError("Experiment number must be at least 1");
      return;
    }
    if (!formData.subject) {
      setFormError("Please select a subject");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        experimentNumber: expNum,
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
      };

      if (isEditing) {
        await experimentsApi.update(currentId, payload);
        setSuccessMsg(`Experiment ${expNum} updated successfully.`);
      } else {
        await experimentsApi.create(payload);
        setSuccessMsg(`Experiment ${expNum} created successfully.`);
      }
      setIsModalOpen(false);
      fetchExperiments();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save experiment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await experimentsApi.delete(deleteTarget._id);
      setSuccessMsg(
        `Experiment ${deleteTarget.experimentNumber} deleted successfully.`
      );
      setDeleteTarget(null);
      fetchExperiments();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Cannot delete experiment. Students may have uploaded documents for it."
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: "Exp #",
      key: "experimentNumber",
      width: "90px",
      render: (row) => <span className="chip-badge">#{row.experimentNumber}</span>,
    },
    {
      title: "Title & Description",
      key: "title",
      render: (row) => (
        <div>
          <strong>{row.title || `Experiment ${row.experimentNumber}`}</strong>
          {row.description && <p className="table-subtext">{row.description}</p>}
        </div>
      ),
    },
    {
      title: "Subject",
      key: "subject",
      width: "200px",
      render: (row) => (
        <div>
          <span>{row.subject?.name || "—"}</span>
          {row.subject?.code && (
            <span className="code-badge-sub">{row.subject.code}</span>
          )}
        </div>
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
            title="Edit Experiment"
            onClick={() => openEditModal(row)}
          >
            ✎
          </button>
          <button
            className="action-icon-btn delete-btn"
            title="Delete Experiment"
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
          <h1>Manage Experiments</h1>
          <p>Configure laboratory experiments and assignments for each subject.</p>
        </div>
        <button
          className="primary-button"
          onClick={openCreateModal}
          disabled={subjects.length === 0}
          title={
            subjects.length === 0
              ? "Create a subject first before adding experiments"
              : undefined
          }
        >
          + Add Experiment
        </button>
      </section>

      {/* Filter Bar */}
      <section className="filter-bar">
        <div className="filter-group">
          <label htmlFor="filter-exp-sem">Semester:</label>
          <select
            id="filter-exp-sem"
            className="form-select"
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setSelectedSubject(""); // reset subject filter
            }}
          >
            <option value="">All Semesters</option>
            {semesters.map((sem) => (
              <option key={sem._id} value={sem._id}>
                Semester {sem.number} ({sem.name})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-exp-subj">Subject:</label>
          <select
            id="filter-exp-subj"
            className="form-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects ({filteredSubjectsForSelect.length})</option>
            {filteredSubjectsForSelect.map((subj) => (
              <option key={subj._id} value={subj._id}>
                {subj.name} {subj.code ? `(${subj.code})` : ""}
              </option>
            ))}
          </select>
        </div>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading experiments…" />
      ) : (
        <DataTable
          columns={columns}
          data={experiments}
          emptyMessage={
            subjects.length === 0
              ? "No subjects created yet. Please create a subject first."
              : selectedSubject
              ? "No experiments found for this subject. Click '+ Add Experiment' to create one."
              : "No experiments found. Click '+ Add Experiment' to configure experiments."
          }
        />
      )}

      {/* Add / Edit Experiment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={
          isEditing
            ? `Edit Experiment ${formData.experimentNumber}`
            : "Add New Experiment"
        }
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
              {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Create Experiment"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <AlertBanner message={formError} type="error" onClose={() => setFormError("")} />

          <div className="form-group">
            <label htmlFor="exp-subject">Subject *</label>
            <select
              id="exp-subject"
              className="form-select"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              disabled={isSubmitting}
            >
              <option value="">Select a Subject</option>
              {subjects.map((subj) => (
                <option key={subj._id} value={subj._id}>
                  {subj.name} {subj.code ? `[${subj.code}]` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="exp-number">Experiment Number *</label>
            <input
              id="exp-number"
              type="number"
              min="1"
              value={formData.experimentNumber}
              onChange={(e) =>
                setFormData({ ...formData, experimentNumber: e.target.value })
              }
              placeholder="e.g. 1"
              required
              disabled={isSubmitting}
            />
            <small className="form-help">Unique number within this subject.</small>
          </div>

          <div className="form-group">
            <label htmlFor="exp-title">Experiment Title</label>
            <input
              id="exp-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Implementation of Binary Search Tree"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="exp-desc">Description / Instructions</label>
            <textarea
              id="exp-desc"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary or lab requirements…"
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
        title="Delete Experiment"
        message={`Are you sure you want to delete Experiment #${deleteTarget?.experimentNumber}${
          deleteTarget?.title ? ` - "${deleteTarget.title}"` : ""
        }? This will fail if any student has already uploaded a document for it.`}
        confirmText="Delete Experiment"
        isLoading={isDeleting}
      />
    </div>
  );
}
