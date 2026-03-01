import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
        <button
          onClick={onConfirm}
          className={danger ? 'btn-danger' : 'btn-primary'}
          disabled={loading}
        >
          {loading ? 'Please wait...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}
