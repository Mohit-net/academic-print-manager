export default function AlertBanner({ type = "error", message, onClose }) {
  if (!message) return null;

  return (
    <div className={`alert-banner alert-${type}`} role="alert">
      <span className="alert-icon">
        {type === "error" ? "⚠" : type === "success" ? "✓" : "ℹ"}
      </span>
      <span className="alert-message">{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Dismiss message">
          ✕
        </button>
      )}
    </div>
  );
}
