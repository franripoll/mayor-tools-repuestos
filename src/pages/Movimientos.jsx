import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { ArrowLeftRight, Search, ArrowDown, ArrowUp, Plus } from 'lucide-react'
import ModalMovimiento from '../components/ModalMovimiento'

export default function Movimientos() {
  const { toast } = useApp()
  const [movimientos, setMovimientos] = useState([])
  const [repuestos, setRepuestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroRepuesto, setFiltroRepuesto] = useState('')
  const [modalMov, setModalMov] = useState(null)

  async function fetchAll() {
    const [{ data: movs }, { data: reps }] = await Promise.all([
      supabase.from('movimientos')
        .select('*, repuestos(nombre), maquinas(nombre), usuarios(nombre)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('repuestos').select('id, nombre').eq('activo', true).order('nombre'),
    ])
    setMovimientos(movs || [])
    setRepuestos(reps || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = movimientos.filter(m => {
    const matchTipo = !filtroTipo || m.tipo === filtroTipo
    const matchRep = !filtroRepuesto || m.repuesto_id === filtroRepuesto
    return matchTipo && matchRep
  })

  const tipoStyle = {
    entrada: { color: 'var(--success)', bg: 'rgba(63,185,80,0.1)', label: 'Entrada', icon: <ArrowUp size={12} /> },
    salida: { color: 'var(--danger)', bg: 'rgba(248,81,73,0.1)', label: 'Salida', icon: <ArrowDown size={12} /> },
    ajuste: { color: 'var(--accent)', bg: 'rgba(88,166,255,0.1)', label: 'Ajuste', icon: null },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Movimientos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Historial de entradas y salidas de stock</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMov('select')}>
          <Plus size={16} /> Nuevo movimiento
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ width: 'auto', flex: '0 0 auto' }}>
          <option value="">Todos los tipos</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
          <option value="ajuste">Ajustes</option>
        </select>
        <select value={filtroRepuesto} onChange={e => setFiltroRepuesto(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
          <option value="">Todos los repuestos</option>
          {repuestos.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ArrowLeftRight size={40} />
            <div style={{ fontWeight: 500 }}>Sin movimientos</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Repuesto</th>
                  <th>Cant.</th>
                  <th>Stock ant. → post.</th>
                  <th>Máquina</th>
                  <th>Usuario</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const t = tipoStyle[m.tipo] || tipoStyle.ajuste
                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(m.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 500,
                          color: t.color, background: t.bg,
                          padding: '2px 8px', borderRadius: 10,
                        }}>
                          {t.icon}{t.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{m.repuestos?.nombre}</td>
                      <td style={{ fontWeight: 700, color: m.tipo === 'salida' ? 'var(--danger)' : 'var(--success)' }}>
                        {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {m.stock_anterior} → {m.stock_posterior}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {m.maquinas?.nombre || 'Almacén central'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.usuarios?.nombre || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.notas || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para seleccionar repuesto antes del movimiento */}
      {modalMov === 'select' && (
        <SelectorRepuestoModal
          repuestos={repuestos}
          onSelect={r => setModalMov(r)}
          onClose={() => setModalMov(null)}
        />
      )}
      {modalMov && modalMov !== 'select' && (
        <ModalMovimiento
          repuesto={modalMov}
          onClose={() => setModalMov(null)}
          onSaved={() => { setModalMov(null); fetchAll() }}
        />
      )}
    </div>
  )
}

function SelectorRepuestoModal({ repuestos, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = repuestos.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Seleccionar repuesto</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}><span>✕</span></button>
        </div>
        <div className="modal-body">
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar repuesto..." style={{ paddingLeft: 32 }} autoFocus />
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(r => (
              <button key={r.id} className="btn btn-secondary" onClick={() => onSelect(r)}
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                {r.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
