import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Plus, Search, Package, AlertTriangle, Edit2, ArrowLeftRight, Filter } from 'lucide-react'
import ModalRepuesto from '../components/ModalRepuesto'
import ModalMovimiento from '../components/ModalMovimiento'

export default function Repuestos() {
  const { toast } = useApp()
  const [repuestos, setRepuestos] = useState([])
  const [maquinasMap, setMaquinasMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCritico, setFiltroCritico] = useState(false)
  const [filtroStockBajo, setFiltroStockBajo] = useState(false)
  const [modalRepuesto, setModalRepuesto] = useState(null)
  const [modalMovimiento, setModalMovimiento] = useState(null)

  async function fetchRepuestos() {
    const [{ data: reps, error }, { data: maquinas }] = await Promise.all([
      supabase
        .from('repuestos')
        .select('*, proveedores(nombre), repuesto_maquinas(maquina_id)')
        .eq('activo', true)
        .order('nombre'),
      supabase.from('maquinas').select('id, nombre, parent_id'),
    ])
    if (error) { toast.error('Error al cargar repuestos'); setLoading(false); return }

    const map = {}
    ;(maquinas || []).forEach(m => { map[m.id] = m })
    setMaquinasMap(map)
    setRepuestos(reps || [])
    setLoading(false)
  }

  useEffect(() => { fetchRepuestos() }, [])

  function rutaMaquina(maquinaId) {
    const m = maquinasMap[maquinaId]
    if (!m) return null
    if (m.parent_id && maquinasMap[m.parent_id]) {
      return `${maquinasMap[m.parent_id].nombre} › ${m.nombre}`
    }
    return m.nombre
  }

  const filtered = repuestos.filter(r => {
    const matchSearch = r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.referencia_fabricante || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.referencia_interna || '').toLowerCase().includes(search.toLowerCase())
    const matchCritico = !filtroCritico || r.critico
    const matchStockBajo = !filtroStockBajo || r.stock_actual <= r.stock_minimo
    return matchSearch && matchCritico && matchStockBajo
  })

  function getStockStyle(r) {
    if (r.stock_actual <= 0) return { color: 'var(--danger)', fontWeight: 700 }
    if (r.stock_actual <= r.stock_minimo) return { color: 'var(--alert)', fontWeight: 600 }
    return { color: 'var(--success)', fontWeight: 600 }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Repuestos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            {repuestos.length} repuestos en catálogo
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalRepuesto('new')}>
          <Plus size={16} /> Nuevo repuesto
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, referencia..."
            style={{ paddingLeft: 32 }}
          />
        </div>
        <button
          className={`btn ${filtroCritico ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltroCritico(!filtroCritico)}
        >
          <AlertTriangle size={14} /> Críticos
        </button>
        <button
          className={`btn ${filtroStockBajo ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltroStockBajo(!filtroStockBajo)}
        >
          <Filter size={14} /> Stock bajo
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={40} />
            <div style={{ fontWeight: 500 }}>No se encontraron repuestos</div>
            <div style={{ fontSize: 12 }}>Ajusta los filtros o añade un nuevo repuesto</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ref. fabricante</th>
                  <th>Ubicación</th>
                  <th>Máquina / Parte</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.nombre}</div>
                      {r.referencia_interna && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ref. int: {r.referencia_interna}</div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.referencia_fabricante || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.ubicacion_almacen || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {r.repuesto_maquinas?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {r.repuesto_maquinas.map((rm, i) => {
                            const ruta = rutaMaquina(rm.maquina_id)
                            return ruta ? (
                              <span key={i} className="badge badge-accent" style={{ width: 'fit-content' }}>
                                {ruta}
                              </span>
                            ) : null
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Almacén central</span>
                      )}
                    </td>
                    <td style={getStockStyle(r)}>{r.stock_actual}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.stock_minimo}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {r.critico && <span className="badge badge-danger">Crítico</span>}
                        {r.stock_actual <= 0 && <span className="badge badge-danger">Sin stock</span>}
                        {r.stock_actual > 0 && r.stock_actual <= r.stock_minimo && <span className="badge badge-warning">Stock bajo</span>}
                        {r.stock_actual > r.stock_minimo && <span className="badge badge-success">OK</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => setModalMovimiento(r)} title="Registrar movimiento">
                          <ArrowLeftRight size={14} />
                        </button>
                        <button className="btn btn-ghost" onClick={() => setModalRepuesto(r)} title="Editar">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalRepuesto !== null && (
        <ModalRepuesto
          repuesto={modalRepuesto === 'new' ? null : modalRepuesto}
          onClose={() => setModalRepuesto(null)}
          onSaved={() => { setModalRepuesto(null); fetchRepuestos() }}
        />
      )}
      {modalMovimiento !== null && (
        <ModalMovimiento
          repuesto={modalMovimiento}
          onClose={() => setModalMovimiento(null)}
          onSaved={() => { setModalMovimiento(null); fetchRepuestos() }}
        />
      )}
    </div>
  )
}
