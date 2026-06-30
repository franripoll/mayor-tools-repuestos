import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Plus, ShoppingCart, ChevronRight, X, Trash2, Check, Package } from 'lucide-react'

const ESTADOS = {
  borrador: { label: 'Borrador', color: 'var(--text-secondary)', bg: 'rgba(139,148,158,0.15)' },
  enviado: { label: 'Enviado', color: 'var(--accent)', bg: 'rgba(88,166,255,0.15)' },
  parcial: { label: 'Recepción parcial', color: 'var(--alert)', bg: 'rgba(240,136,62,0.15)' },
  completado: { label: 'Completado', color: 'var(--success)', bg: 'rgba(63,185,80,0.15)' },
  cancelado: { label: 'Cancelado', color: 'var(--danger)', bg: 'rgba(248,81,73,0.15)' },
}

export default function Pedidos() {
  const { toast } = useApp()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [pedidoDetalle, setPedidoDetalle] = useState(null)

  async function fetchPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*, proveedores(nombre), usuarios(nombre)')
      .order('created_at', { ascending: false })
    setPedidos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPedidos() }, [])

  const filtered = pedidos.filter(p => !filtroEstado || p.estado === filtroEstado)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Pedidos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{pedidos.length} pedidos en total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalNuevo(true)}><Plus size={16} /> Nuevo pedido</button>
      </div>

      {/* Filtro estado */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn ${!filtroEstado ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltroEstado('')}>Todos</button>
        {Object.entries(ESTADOS).map(([k, v]) => (
          <button key={k} className={`btn ${filtroEstado === k ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltroEstado(filtroEstado === k ? '' : k)}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={40} />
            <div style={{ fontWeight: 500 }}>No hay pedidos</div>
          </div>
        ) : filtered.map(p => {
          const est = ESTADOS[p.estado] || ESTADOS.borrador
          return (
            <div key={p.id}
              style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => setPedidoDetalle(p)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p.numero}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: est.color, background: est.bg, padding: '2px 8px', borderRadius: 10 }}>{est.label}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {p.proveedores?.nombre || 'Sin proveedor'} · {p.usuarios?.nombre || '—'} ·{' '}
                  {new Date(p.created_at).toLocaleDateString('es-ES')}
                  {p.fecha_estimada && ` · Entrega: ${new Date(p.fecha_estimada).toLocaleDateString('es-ES')}`}
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </div>
          )
        })}
      </div>

      {modalNuevo && (
        <ModalNuevoPedido
          onClose={() => setModalNuevo(false)}
          onSaved={() => { setModalNuevo(false); fetchPedidos() }}
        />
      )}
      {pedidoDetalle && (
        <DetallePedido
          pedido={pedidoDetalle}
          onClose={() => setPedidoDetalle(null)}
          onUpdated={() => { setPedidoDetalle(null); fetchPedidos() }}
        />
      )}
    </div>
  )
}

function ModalNuevoPedido({ onClose, onSaved }) {
  const { usuario, toast } = useApp()
  const [proveedores, setProveedores] = useState([])
  const [repuestos, setRepuestos] = useState([])
  const [form, setForm] = useState({ proveedor_id: '', fecha_estimada: '', notas: '' })
  const [lineas, setLineas] = useState([{ repuesto_id: '', cantidad_pedida: 1 }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('proveedores').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('repuestos').select('id, nombre, stock_actual, stock_minimo').eq('activo', true).order('nombre'),
    ]).then(([{ data: p }, { data: r }]) => { setProveedores(p || []); setRepuestos(r || []) })
  }, [])

  function setLinea(i, field, value) {
    setLineas(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }
  function addLinea() { setLineas(prev => [...prev, { repuesto_id: '', cantidad_pedida: 1 }]) }
  function removeLinea(i) { setLineas(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSubmit() {
    const lineasValidas = lineas.filter(l => l.repuesto_id)
    if (lineasValidas.length === 0) { toast.error('Añade al menos un repuesto'); return }
    setLoading(true)
    try {
      // Generar número de pedido
      const { data: numData } = await supabase.rpc('generar_numero_pedido')
      const numero = numData

      const { data: pedido, error } = await supabase.from('pedidos').insert({
        numero,
        proveedor_id: form.proveedor_id || null,
        usuario_id: usuario?.id || null,
        estado: 'borrador',
        fecha_estimada: form.fecha_estimada || null,
        notas: form.notas || null,
      }).select().single()
      if (error) throw error

      await supabase.from('pedido_lineas').insert(
        lineasValidas.map(l => ({
          pedido_id: pedido.id,
          repuesto_id: l.repuesto_id,
          cantidad_pedida: parseInt(l.cantidad_pedida) || 1,
          cantidad_recibida: 0,
        }))
      )
      toast.success(`Pedido ${numero} creado`)
      onSaved()
    } catch (e) { toast.error(e.message || 'Error al crear pedido') } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Nuevo pedido</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <select value={form.proveedor_id} onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha estimada entrega</label>
              <input type="date" value={form.fecha_estimada} onChange={e => setForm(f => ({ ...f, fecha_estimada: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Líneas del pedido</label>
            {lineas.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select value={l.repuesto_id} onChange={e => setLinea(i, 'repuesto_id', e.target.value)} style={{ flex: 1 }}>
                  <option value="">Seleccionar repuesto...</option>
                  {repuestos.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} (stock: {r.stock_actual})
                    </option>
                  ))}
                </select>
                <input type="number" min="1" value={l.cantidad_pedida}
                  onChange={e => setLinea(i, 'cantidad_pedida', e.target.value)}
                  style={{ width: 70, textAlign: 'center' }} />
                <button className="btn btn-ghost" onClick={() => removeLinea(i)} style={{ padding: 6 }}>
                  <Trash2 size={14} color="var(--danger)" />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addLinea} style={{ marginTop: 4 }}>
              <Plus size={14} /> Añadir línea
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            Crear pedido
          </button>
        </div>
      </div>
    </div>
  )
}

function DetallePedido({ pedido, onClose, onUpdated }) {
  const { usuario, toast } = useApp()
  const [lineas, setLineas] = useState([])
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState(false)

  useEffect(() => {
    supabase.from('pedido_lineas').select('*, repuestos(nombre, stock_actual)')
      .eq('pedido_id', pedido.id)
      .then(({ data }) => { setLineas(data || []); setLoading(false) })
  }, [pedido.id])

  async function cambiarEstado(nuevoEstado) {
    setActualizando(true)
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedido.id)
    toast.success(`Pedido marcado como ${ESTADOS[nuevoEstado]?.label}`)
    setActualizando(false)
    onUpdated()
  }

  async function registrarRecepcion(linea, cantidadRecibida) {
    const cant = parseInt(cantidadRecibida)
    if (!cant || cant <= 0) return
    setActualizando(true)
    try {
      const nuevaRecibida = linea.cantidad_recibida + cant
      const cerrada = nuevaRecibida >= linea.cantidad_pedida
      await supabase.from('pedido_lineas').update({ cantidad_recibida: nuevaRecibida, cerrada }).eq('id', linea.id)
      // Registrar entrada de stock
      await supabase.from('movimientos').insert({
        repuesto_id: linea.repuesto_id,
        usuario_id: usuario?.id || null,
        tipo: 'entrada',
        cantidad: cant,
        stock_anterior: linea.repuestos.stock_actual,
        stock_posterior: linea.repuestos.stock_actual + cant,
        notas: `Recepción pedido ${pedido.numero}`,
      })
      // Verificar si todas las líneas están cerradas
      const { data: todasLineas } = await supabase.from('pedido_lineas').select('cerrada').eq('pedido_id', pedido.id)
      const todasCerradas = todasLineas?.every(l => l.cerrada)
      if (todasCerradas) await supabase.from('pedidos').update({ estado: 'completado' }).eq('id', pedido.id)
      else await supabase.from('pedidos').update({ estado: 'parcial' }).eq('id', pedido.id)
      toast.success('Recepción registrada y stock actualizado')
      onUpdated()
    } catch (e) { toast.error('Error al registrar recepción') } finally { setActualizando(false) }
  }

  const est = ESTADOS[pedido.estado] || ESTADOS.borrador

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{pedido.numero}</h2>
              <span style={{ fontSize: 11, fontWeight: 500, color: est.color, background: est.bg, padding: '2px 8px', borderRadius: 10 }}>{est.label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {pedido.proveedores?.nombre || 'Sin proveedor'} · {new Date(pedido.created_at).toLocaleDateString('es-ES')}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Líneas */}
          {loading ? <div className="spinner" /> : lineas.map(l => (
            <div key={l.id} style={{
              padding: 12, background: 'var(--bg)', borderRadius: 6,
              border: `1px solid ${l.cerrada ? 'rgba(63,185,80,0.3)' : 'var(--border)'}`,
              marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{l.repuestos?.nombre}</span>
                  {l.cerrada && <span className="badge badge-success" style={{ marginLeft: 8 }}>Completo</span>}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {l.cantidad_recibida} / {l.cantidad_pedida}
                </span>
              </div>
              {/* Barra de progreso */}
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 8 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: l.cerrada ? 'var(--success)' : 'var(--accent)',
                  width: `${Math.min(100, (l.cantidad_recibida / l.cantidad_pedida) * 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              {!l.cerrada && pedido.estado !== 'cancelado' && (
                <RecepcionInput linea={l} onRecibir={cant => registrarRecepcion(l, cant)} />
              )}
            </div>
          ))}

          {pedido.notas && (
            <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
              {pedido.notas}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {pedido.estado === 'borrador' && (
              <button className="btn btn-secondary" onClick={() => cambiarEstado('enviado')} disabled={actualizando}>
                Marcar como enviado
              </button>
            )}
            {pedido.estado !== 'cancelado' && pedido.estado !== 'completado' && (
              <button className="btn btn-danger" onClick={() => cambiarEstado('cancelado')} disabled={actualizando}>
                Cancelar pedido
              </button>
            )}
          </div>
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

function RecepcionInput({ linea, onRecibir }) {
  const [cant, setCant] = useState('')
  const pendiente = linea.cantidad_pedida - linea.cantidad_recibida
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input type="number" min="1" max={pendiente} value={cant}
        onChange={e => setCant(e.target.value)}
        placeholder={`Hasta ${pendiente}`}
        style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} />
      <button className="btn btn-primary" style={{ padding: '6px 12px' }}
        onClick={() => { onRecibir(cant); setCant('') }}
        disabled={!cant || parseInt(cant) <= 0}>
        <Check size={14} /> Recibir
      </button>
    </div>
  )
}
