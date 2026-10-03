import { useEffect, useState } from "react";
import { studentsApi } from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create Student Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await studentsApi.getAll();
      setStudents(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await studentsApi.getAll();
        if (isMounted) setStudents(data);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load students.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setFormData({ name: "", email: "", password: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Student name is required");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Student email is required");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await studentsApi.create({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      setSuccessMsg(`Student account created successfully for "${formData.name}".`);
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (row) => (
        <div className="user-cell">
          <div className="avatar-sm">
            {row.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <div>
            <strong>{row.name}</strong>
          </div>
        </div>
      ),
    },
    {
      title: "Email Address",
      key: "email",
      render: (row) => <span className="text-secondary">{row.email}</span>,
    },
    {
      title: "Role",
      key: "role",
      width: "120px",
      render: (row) => <span className="role-badge">{row.role}</span>,
    },
    {
      title: "Registered On",
      key: "createdAt",
      width: "160px",
      render: (row) => (
        <span className="text-muted">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">User Management</span>
          <h1>Student Accounts</h1>
          <p>Register and manage authenticated student access to Academic Print Manager.</p>
        </div>
        <button className="primary-button" onClick={openCreateModal}>
          + Register Student
        </button>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading student accounts…" />
      ) : (
        <DataTable
          columns={columns}
          data={students}
          emptyMessage="No students registered yet. Click '+ Register Student' to create an account."
        />
      )}

      {/* Register Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Register New Student"
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
              {isSubmitting ? "Creating…" : "Register Student"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <AlertBanner message={formError} type="error" onClose={() => setFormError("")} />

          <div className="form-group">
            <label htmlFor="student-name">Full Name *</label>
            <input
              id="student-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alex Morgan"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="student-email">Email Address *</label>
            <input
              id="student-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. alex@student.edu"
              required
              disabled={isSubmitting}
            />
            <small className="form-help">Must be a unique email address.</small>
          </div>

          <div className="form-group">
            <label htmlFor="student-password">Initial Password *</label>
            <input
              id="student-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 6 characters"
              required
              minLength={6}
              disabled={isSubmitting}
            />
            <small className="form-help">Minimum 6 characters.</small>
          </div>
        </form>
      </Modal>
    </div>
  );
}
