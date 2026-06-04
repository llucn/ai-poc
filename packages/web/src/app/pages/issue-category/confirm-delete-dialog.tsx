type Props = {
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  message?: string;
};

export function ConfirmDeleteDialog({ onCancel, onConfirm, busy, message = 'Delete categories?' }: Props) {
  return (
    <div
      className="ic-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="ic-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ic-delete-title"
      >
        <h2 id="ic-delete-title" className="ic-modal-title">
          {message}
        </h2>
        <div className="ic-modal-actions">
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
