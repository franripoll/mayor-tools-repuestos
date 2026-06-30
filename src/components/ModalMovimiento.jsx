import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { X, ArrowDown, ArrowUp } from 'lucide-react'

export default function ModalMovimiento({ repuesto, onClose, onSaved }) {
  const { usuario, toast } = useApp()
  const [tipo, setTipo] = useState('salida')
  const [cantidad, setCantidad] = useState(1)
  const [maquinaId, setMaquinaId] = useState('')
  const [notas, setNotas] = useState('')
  const [maquinas, setMaquinas] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchMaquinas() {
      // Si el repuesto tiene máquinas asociadas, las mostramos primero
      const { data: rm } = await supabase
        .from('repuesto_maquinas')
        .select('maquinas(id, nombre)')
        .eq('repuesto_id', repuesto.id)

      if (rm && rm.length > 0) {
        setMaquinas(rm.map(r => r.maquinas).filter(Boolean))
      } else {
        const { data } = await supabase.from('maquinas').select('id, nombre').eq('activa', true).order('nombre')
        setMaquinas(data || [])
      }
    }
    fetchMaquinas()
  }, [repuesto.id])

  const stockResultante = tipo === 'entrada'
    ? repuesto.stock_actual + parseInt(cantidad || 0)
    : repuesto.stock_actual - parseInt(cantidad || 0)

  async function handleSubmit() {
    const cant = parseInt(cantidad)
    if (!cant || cant <= 0) { toast.error('La cantidad debe ser mayor que 0'); return }
    if (tipo === 'salida' && cant > repuesto.stock_actual) {
      toast.error('No hay suficiente stock'); return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('movimientos').insert({
        repuesto_id: repuesto.id,
        maquina_id: maquinaId || null,
        usuario_id: usuario?.id || null,
        tipo,
        cantidad: cant,
        stock_anterior: repuesto.stock_actual,
        stock_posterior: stockResultante,
        notas: notas || null,
      })
      if (error) throw error
      toast.success(`${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente`)
      onSaved()
    } catch (e) {
      toast.error(e.message || 'Error al registrar movimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Registrar movimiento</h2>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{repuesto.nombre}</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Stock actual */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'var(--bg)', borderRadius: 6,
            border: '1px solid var(--border)', marginBottom: 16,
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Stock actual</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{repuesto.stock_actual}</span>
          </div>

          {/* Tipo */}
          <div className="form-group">
            <label className="form-label">Tipo de movimiento</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={`btn ${tipo === 'salida' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTipo('salida')}
                style={{ flex: 1 }}
              >
                <ArrowDown size={14} /> Salida
              </button>
              <button
                type="button"
                className={`btn ${tipo === 'entrada' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTipo('entrada')}
                style={{ flex: 1 }}
              >
                <ArrowUp size={14} /> Entrada
              </button>
            </div>
          </div>

          {/* Cantidad */}
          <div className="form-group">
            <label className="form-label">Cantidad</label>
            <input
              type="number" min="1"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              style={{ fontSize: 18, textAlign: 'center', fontWeight: 600 }}
            />
          </div>

          {/* Stock resultante */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'var(--bg)', borderRadius: 6,
            border: `1px solid ${stockResultante < 0 ? 'var(--danger)' : stockResultante <= repuesto.stock_minimo ? 'var(--alert)' : 'var(--border)'}`,
            marginBottom: 16,
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Stock resultante</span>
            <span style={{
              fontSize: 20, fontWeight: 700,
              color: stockResultante < 0 ? 'var(--danger)' : stockResultante <= repuesto.stock_minimo ? 'var(--alert)' : 'var(--success)',
            }}>
              {stockResultante}
            </span>
          </div>

          {/* Máquina */}
          <div className="form-group">
            <label className="form-label">
              {tipo === 'salida' ? 'Máquina destino' : 'Origen'}
            </label>
            <select value={maquinaId} onChange={e => setMaquinaId(e.target.value)}>
              <option value="">Almacén central</option>
              {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>

          {/* Notas */}
          <div className="form-group">
            <label className="form-label">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Motivo, avería, observaciones..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          {stockResultante < 0 && (
            <div className="alert alert-danger">
              No hay suficiente stock para esta salida
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || stockResultante < 0}
          >
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            Confirmar {tipo}
          </button>
        </div>
      </div>
    </div>
  )
}
