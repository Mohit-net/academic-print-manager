import Modal from "./Modal";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      footer={
        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={isDanger ? "danger-button" : "primary-button"}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing…" : confirmText}
          </button>
        </div>
      }
    >
      <p className="confirm-modal-text">{message}</p>
    </Modal>
  );
}
