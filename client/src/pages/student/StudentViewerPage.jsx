import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { documentsApi, printHistoryApi } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import AlertBanner from "../../components/common/AlertBanner";
import { sendNotification } from "../../utils/notifications";

export default function StudentViewerPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blobUrl, setBlobUrl] = useState(null);
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [printMsg, setPrintMsg] = useState("");
  const [isLoggingPrint, setIsLoggingPrint] = useState(false);

  // Keep a ref so the cleanup effect always sees the latest blobUrl
  const blobUrlRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Fetch the document metadata list to get file name
        const docs = await documentsApi.getMyDocuments();
        const found = docs.find((d) => d._id === documentId);
        if (isMounted) setDocument(found || null);

        // Stream the PDF blob
        const blob = await documentsApi.viewBlob(documentId);
        if (!isMounted) return;

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load the PDF. You may not have access to this document."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
      // Revoke blob URL on unmount to free memory
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [documentId]);

  const handleLogPrint = async () => {
    setIsLoggingPrint(true);
    setPrintMsg("");
    try {
      await printHistoryApi.log(documentId);
      setPrintMsg("Logged as printed successfully.");
      sendNotification(
        "Print logged ✓",
        `${document?.fileName || "Document"} has been logged as printed.`,
        user
      );
    } catch (err) {
      setPrintMsg(err.response?.data?.message || "Failed to log print.");
    } finally {
      setIsLoggingPrint(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="viewer-page">
      {/* Viewer Top Bar */}
      <div className="viewer-topbar">
        <div className="viewer-topbar-left">
          <button
            className="viewer-back-btn"
            onClick={() => navigate("/student/documents")}
            type="button"
          >
            ← Back to Documents
          </button>
          {document && (
            <div>
              <div className="viewer-file-name">{document.fileName}</div>
              {(document.fileSize || document.experiment) && (
                <div className="viewer-file-meta">
                  {document.experiment?.subject?.name && (
                    <span>
                      {document.experiment.subject.name} ·{" "}
                    </span>
                  )}
                  {document.experiment?.experimentNumber && (
                    <span>Exp #{document.experiment.experimentNumber} · </span>
                  )}
                  {document.fileSize && (
                    <span>{formatFileSize(document.fileSize)}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {blobUrl && (
          <button
            className={`secondary-button-sm ${isLoggingPrint ? "" : ""}`}
            onClick={handleLogPrint}
            disabled={isLoggingPrint}
            title="Record this document as printed in your print history"
            type="button"
          >
            {isLoggingPrint ? "Logging…" : "◷ Log as Printed"}
          </button>
        )}
      </div>

      {/* Print log feedback */}
      {printMsg && (
        <div style={{ padding: "0 34px" }}>
          <AlertBanner
            message={printMsg}
            type={printMsg.includes("success") ? "success" : "error"}
            onClose={() => setPrintMsg("")}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="viewer-error">
          <div className="spinner-ring" style={{ width: 40, height: 40 }} />
          <p>Loading PDF document…</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="viewer-error">
          <span className="error-icon">⚠</span>
          <h2>Could Not Load Document</h2>
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => navigate("/student/documents")}
            type="button"
            style={{ marginTop: "8px" }}
          >
            ← Back to Documents
          </button>
        </div>
      )}

      {/* PDF iframe */}
      {!isLoading && blobUrl && (
        <div className="viewer-iframe-wrapper">
          <iframe
            src={blobUrl}
            title={document?.fileName || "PDF Viewer"}
            aria-label={`PDF document: ${document?.fileName || "document"}`}
          />
        </div>
      )}
    </div>
  );
}
