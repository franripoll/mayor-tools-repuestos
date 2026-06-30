import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { AlertTriangle, ShoppingCart, Package, Wrench, ArrowRight, TrendingDown } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [criticos, setCriticos] = useState([])
  const [pedidosPendientes, setPedidosPendientes] = useState([])
  const [ultimosMovimientos, setUltimosMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [
        { count: totalRepuestos },
        { count: totalMaquinas },
        { data: criticosBajos },
        { data: pedidos },
        { data: movimientos },
      ] = await Promise.all([
        supabase.from('repuestos').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('maquinas').select('*', { count: 'exact', head: true }).eq('activa', true),
        supabase.from('repuestos').select('id, nombre, stock_actual, stock_minimo, critico')
          .eq('activo', true)
          .or('critico.eq.true,stock_actual.lte.stock_minimo')
          .order('stock_actual'),
        supabase.from('pedidos').select('*, proveedores(nombre)')
          .in('estado', ['borrador', 'enviado', 'parcial'])
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('movimientos').select('*, repuestos(nombre), maquinas(nombre), usuarios(nombre)')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      setStats({ totalRepuestos, totalMaquinas })
      setCriticos(criticosBajos || [])
      setPedidosPendientes(pedidos || [])
      setUltimosMovimientos(movimientos || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  )

  const estadoPedidoColor = {
    borrador: 'var(--text-secondary)',
    enviado: 'var(--accent)',
    parcial: 'var(--alert)',
  }
  const estadoPedidoLabel = { borrador: 'Borrador', enviado: 'Enviado', parcial: 'Parcial' }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          Resumen del estado del almacén de repuestos
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, background: 'rgba(88,166,255,0.1)', borderRadius: 8 }}>
            <Package size={20} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{stats?.totalRepuestos ?? '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Repuestos</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, background: 'rgba(63,185,80,0.1)', borderRadius: 8 }}>
            <Wrench size={20} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{stats?.totalMaquinas ?? '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Máquinas</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, background: 'rgba(248,81,73,0.1)', borderRadius: 8 }}>
            <AlertTriangle size={20} color="var(--danger)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: criticos.length > 0 ? 'var(--danger)' : 'var(--text)' }}>
              {criticos.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stock bajo</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 10, background: 'rgba(240,136,62,0.1)', borderRadius: 8 }}>
            <ShoppingCart size={20} color="var(--alert)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: pedidosPendientes.length > 0 ? 'var(--alert)' : 'var(--text)' }}>
              {pedidosPendientes.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pedidos activos</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Repuestos críticos */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingDown size={16} color="var(--danger)" />
              <span style={{ fontWeight: 500, fontSize: 13 }}>Stock bajo / crítico</span>
            </div>
            <Link to="/repuestos" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {criticos.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <span style={{ fontSize: 12 }}>Todo el stock está en niveles correctos ✓</span>
            </div>
          ) : (
            criticos.map(r => {
              const isCritico = r.stock_actual <= 0
              const isLow = r.stock_actual <= r.stock_minimo
              return (
                <div key={r.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Mínimo: {r.stock_minimo} uds
                      {r.critico && <span style={{ marginLeft: 6, color: 'var(--danger)' }}>● Crítico</span>}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: isCritico ? 'var(--danger)' : isLow ? 'var(--alert)' : 'var(--text)',
                    minWidth: 40, textAlign: 'right',
                  }}>
                    {r.stock_actual}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pedidos pendientes */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={16} color="var(--alert)" />
              <span style={{ fontWeight: 500, fontSize: 13 }}>Pedidos activos</span>
            </div>
            <Link to="/pedidos" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {pedidosPendientes.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <span style={{ fontSize: 12 }}>No hay pedidos pendientes</span>
            </div>
          ) : (
            pedidosPendientes.map(p => (
              <Link key={p.id} to={`/pedidos/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.numero}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {p.proveedores?.nombre || 'Sin proveedor'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: estadoPedidoColor[p.estado],
                    background: `${estadoPedidoColor[p.estado]}22`,
                    padding: '2px 8px', borderRadius: 10,
                  }}>
                    {estadoPedidoLabel[p.estado]}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Últimos movimientos */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', gridColumn: 'span 2' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={16} color="var(--text-secondary)" />
              <span style={{ fontWeight: 500, fontSize: 13 }}>Últimos movimientos</span>
            </div>
            <Link to="/movimientos" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {ultimosMovimientos.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <span style={{ fontSize: 12 }}>Sin movimientos registrados</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Máquina</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosMovimientos.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.repuestos?.nombre}</td>
                      <td>
                        <span className={`badge ${m.tipo === 'entrada' ? 'badge-success' : m.tipo === 'salida' ? 'badge-danger' : 'badge-accent'}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.maquinas?.nombre || 'Almacén central'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.usuarios?.nombre || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {new Date(m.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
