export default function LoadingSpinner({ text = "Loading data…" }) {
  return (
    <div className="loading-state">
      <div className="spinner-ring" />
      <span>{text}</span>
    </div>
  );
}
