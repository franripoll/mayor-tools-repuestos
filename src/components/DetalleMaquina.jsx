import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, Package, FileText, ArrowLeftRight, AlertTriangle, Search } from 'lucide-react'
import ModalMovimiento from './ModalMovimiento'

export default function DetalleMaquina({ maquina, maquinasMap, onClose }) {
  const [repuestos, setRepuestos] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalMovimiento, setModalMovimiento] = useState(null)
  const [search, setSearch] = useState('')

  async function fetchData() {
    const [{ data: rm }, { data: docs }] = await Promise.all([
      supabase
        .from('repuesto_maquinas')
        .select('cantidad_recomendada, repuestos(*)')
        .eq('maquina_id', maquina.id),
      supabase.from('maquina_documentos').select('*').eq('maquina_id', maquina.id),
    ])
    setRepuestos(
      (rm || [])
        .map(r => (r.repuestos ? { ...r.repuestos, cantidad_recomendada: r.cantidad_recomendada } : null))
        .filter(Boolean)
    )
    setDocumentos(docs || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [maquina.id])

  const ruta = maquina.parent_id && maquinasMap[maquina.parent_id]
    ? `${maquinasMap[maquina.parent_id].nombre} › ${maquina.nombre}`
    : null

  const filtered = repuestos.filter(r =>
    r.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (r.referencia_fabricante || '').toLowerCase().includes(search.toLowerCase())
  )

  function getStockStyle(r) {
    if (r.stock_actual <= 0) return { color: 'var(--danger)', fontWeight: 700 }
    if (r.stock_actual <= r.stock_minimo) return { color: 'var(--alert)', fontWeight: 600 }
    return { color: 'var(--success)', fontWeight: 600 }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{maquina.nombre}</h2>
            {ruta && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{ruta}</div>}
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {(maquina.marca || maquina.modelo || maquina.ubicacion) && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {maquina.marca && <span>🏭 {maquina.marca}</span>}
              {maquina.modelo && <span>🔧 {maquina.modelo}</span>}
              {maquina.ubicacion && <span>📍 {maquina.ubicacion}</span>}
            </div>
          )}

          {documentos.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>Documentos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {documentos.map(d => (
                  <a
                    key={d.id}
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', background: 'var(--bg)',
                      borderRadius: 6, border: '1px solid var(--border)',
                      fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                    }}
                  >
                    <FileText size={14} /> {d.nombre}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="form-label" style={{ marginBottom: 0 }}>
              Repuestos {!loading && `(${repuestos.length})`}
            </div>
          </div>

          {repuestos.length > 4 && (
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar en esta lista..."
                style={{ paddingLeft: 32 }}
              />
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <Package size={32} />
              <span style={{ fontSize: 12 }}>
                {repuestos.length === 0 ? 'Sin repuestos asociados a esta parte todavía' : 'Sin resultados para esa búsqueda'}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
              {filtered.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: 'var(--bg)',
                  borderRadius: 6, border: '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {r.nombre}
                      {r.critico && <AlertTriangle size={12} color="var(--danger)" />}
                    </div>
                    {r.referencia_fabricante && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ref: {r.referencia_fabricante}</div>
                    )}
                  </div>
                  <div style={{ ...getStockStyle(r), fontSize: 15, minWidth: 24, textAlign: 'right' }}>
                    {r.stock_actual}
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 6 }}
                    onClick={() => setModalMovimiento(r)}
                    title="Registrar movimiento"
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>

      {modalMovimiento && (
        <ModalMovimiento
          repuesto={modalMovimiento}
          onClose={() => setModalMovimiento(null)}
          onSaved={() => { setModalMovimiento(null); fetchData() }}
        />
      )}
    </div>
  )
}
