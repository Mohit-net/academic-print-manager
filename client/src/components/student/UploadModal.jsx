import { useState, useRef } from "react";
import { documentsApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import Modal from "../common/Modal";
import AlertBanner from "../common/AlertBanner";
import { sendNotification } from "../../utils/notifications";

export default function UploadModal({
  isOpen,
  onClose,
  experiment,
  onSuccess,
}) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setSubmissionDeadline("");
    setError("");
    setIsSubmitting(false);
    setIsDragging(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetState();
      onClose();
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError("");
    if (!selectedFile) return;

    // Check extension and mime type
    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Only PDF files are allowed.");
      return;
    }

    // 20 MB limit
    const maxSizeBytes = 20 * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError("File exceeds 20 MB limit. Please select a smaller PDF.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }
    if (!experiment?._id) {
      setError("No experiment selected.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("experiment", experiment._id);
      formData.append("file", file);
      if (submissionDeadline) {
        formData.append("submissionDeadline", submissionDeadline);
      }

      await documentsApi.upload(formData);

      // Fire browser notification respecting user preference
      sendNotification(
        "Upload successful ✓",
        `Your PDF for Experiment #${experiment?.experimentNumber} has been uploaded.`,
        user
      );

      resetState();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to upload document. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Upload PDF: Experiment #${experiment?.experimentNumber || ""}`}
      footer={
        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleSubmit}
            disabled={isSubmitting || !file}
          >
            {isSubmitting ? "Uploading to Drive…" : "Upload PDF"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <AlertBanner message={error} type="error" onClose={() => setError("")} />

        <div className="upload-context-card">
          <span className="chip-badge">Exp #{experiment?.experimentNumber}</span>
          <div>
            <strong>{experiment?.title || `Experiment ${experiment?.experimentNumber}`}</strong>
            <p className="text-muted">
              {experiment?.subject?.name} {experiment?.subject?.code ? `(${experiment?.subject?.code})` : ""}
            </p>
          </div>
        </div>

        <div
          className={`dropzone ${isDragging ? "dropzone-active" : ""} ${
            file ? "dropzone-has-file" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => validateAndSetFile(e.target.files[0])}
            style={{ display: "none" }}
            disabled={isSubmitting}
          />

          {file ? (
            <div className="file-preview">
              <span className="file-icon">📄</span>
              <div className="file-info">
                <strong>{file.name}</strong>
                <span>{formatFileSize(file.size)}</span>
              </div>
              <button
                type="button"
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="dropzone-prompt">
              <span className="dropzone-icon">⇪</span>
              <strong>Click to upload or drag & drop</strong>
              <p>PDF documents only (Maximum 20 MB)</p>
            </div>
          )}
        </div>

        <div className="form-info-note">
          <span>ℹ</span>
          <small>
            Only one active document is allowed per experiment. To replace an existing
            document, delete it first from My Documents.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="deadline-input">Submission Deadline (Optional)</label>
          <input
            id="deadline-input"
            type="date"
            value={submissionDeadline}
            onChange={(e) => setSubmissionDeadline(e.target.value)}
            disabled={isSubmitting}
            min={new Date().toISOString().split("T")[0]}
          />
          <span className="form-help">
            Set an optional deadline. You'll get a reminder 1 day before if not printed.
          </span>
        </div>
      </form>
    </Modal>
  );
}
