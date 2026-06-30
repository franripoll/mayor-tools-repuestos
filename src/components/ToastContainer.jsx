import { useApp } from '../context/AppContext'
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'

export default function ToastContainer() {
  const { toasts } = useApp()

  const icons = {
    success: <CheckCircle size={16} color="var(--success)" />,
    error: <AlertCircle size={16} color="var(--danger)" />,
    warning: <AlertTriangle size={16} color="var(--alert)" />,
  }

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
