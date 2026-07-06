import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Search, Wrench, ChevronRight, Package, ArrowLeftRight } from 'lucide-react'
import ModalMovimiento from '../components/ModalMovimiento'

export default function Registrar() {
  const { toast } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [repuestos, setRepuestos] = useState([])
  const [maquinas, setMaquinas] = useState([])
  const [maquinasMap, setMaquinasMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalMovimiento, setModalMovimiento] = useState(null)

  async function fetchDatos() {
    const [{ data: reps, error }, { data: maqs }] = await Promise.all([
      supabase
        .from('repuestos')
        .select('*, repuesto_maquinas(maquina_id, posicion)')
        .eq('activo', true)
        .order('nombre'),
      supabase.from('maquinas').select('id, nombre, parent_id').eq('activa', true).order('nombre'),
    ])
    if (error) { toast.error('Error al cargar repuestos'); setLoading(false); return }
    setRepuestos(reps || [])
    const map = {}
    ;(maqs || []).forEach(m => { map[m.id] = m })
    setMaquinasMap(map)
    setMaquinas((maqs || []).filter(m => !m.parent_id))
    setLoading(false)
  }

  useEffect(() => { fetchDatos() }, [])

  function rutaMaquina(maquinaId) {
    const m = maquinasMap[maquinaId]
    if (!m) return null
    const partes = [m.nombre]
    let actual = m
    while (actual.parent_id && maquinasMap[actual.parent_id]) {
      actual = maquinasMap[actual.parent_id]
      partes.unshift(actual.nombre)
    }
    return partes.join(' › ')
  }

  const q = search.trim().toLowerCase()
  const resultados = q === '' ? [] : repuestos.filter(r => {
    const enPosicion = r.repuesto_maquinas?.some(rm => (rm.posicion || '').toLowerCase().includes(q))
    return r.nombre.toLowerCase().includes(q) ||
      (r.referencia_fabricante || '').toLowerCase().includes(q) ||
      enPosicion
  }).slice(0, 30)

  function getStockStyle(r) {
    if (r.stock_actual <= 0) return { color: 'var(--danger)', fontWeight: 700 }
    if (r.stock_actual <= r.stock_minimo) return { color: 'var(--alert)', fontWeight: 600 }
    return { color: 'var(--success)', fontWeight: 600 }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Registrar movimiento</h1>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nombre, código o posición..."
          autoFocus
          style={{ paddingLeft: 36, fontSize: 15, height: 44 }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : q !== '' ? (
        resultados.length === 0 ? (
          <div className="empty-state">
            <Package size={36} />
            <div style={{ fontWeight: 500 }}>Sin resultados</div>
            <div style={{ fontSize: 12 }}>Prueba con otro nombre, código o posición</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resultados.map(r => (
              <button
                key={r.id}
                onClick={() => setModalMovimiento(r)}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  textAlign: 'left', cursor: 'pointer', width: '100%',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{r.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {r.referencia_fabricante && <span>Ref. {r.referencia_fabricante} · </span>}
                    {r.repuesto_maquinas?.[0] && (
                      <span>{rutaMaquina(r.repuesto_maquinas[0].maquina_id)}{r.repuesto_maquinas[0].posicion ? ` · ${r.repuesto_maquinas[0].posicion}` : ''}</span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 15, ...getStockStyle(r) }}>{r.stock_actual}</span>
                <ArrowLeftRight size={16} color="var(--text-secondary)" />
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>O elige la máquina</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {maquinas.map(m => (
              <button
                key={m.id}
                onClick={() => navigate('/maquinas', { state: { focusMaquinaId: m.id } })}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                  textAlign: 'left', cursor: 'pointer', width: '100%',
                }}
              >
                <Wrench size={18} color="var(--accent)" />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{m.nombre}</span>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </button>
            ))}
          </div>
        </>
      )}

      {modalMovimiento !== null && (
        <ModalMovimiento
          repuesto={modalMovimiento}
          onClose={() => setModalMovimiento(null)}
          onSaved={() => { setModalMovimiento(null); fetchDatos() }}
        />
      )}
    </div>
  )
}
