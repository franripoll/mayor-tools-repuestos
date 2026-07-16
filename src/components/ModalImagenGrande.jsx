import { X } from 'lucide-react'

export default function ModalImagenGrande({ url, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Foto</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}
