import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  LayoutDashboard, Wrench, Package, Truck, Zap,
  ArrowLeftRight, ShoppingCart, Settings, LogOut, X, Menu,
} from 'lucide-react'
import { useState } from 'react'

const TODOS = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/registrar', icon: Zap, label: 'Registrar' },
  { to: '/maquinas', icon: Wrench, label: 'Máquinas' },
  { to: '/repuestos', icon: Package, label: 'Repuestos' },
  { to: '/movimientos', icon: ArrowLeftRight, label: 'Movimientos' },
  { to: '/pedidos', icon: ShoppingCart, label: 'Pedidos' },
  { to: '/proveedores', icon: Truck, label: 'Proveedores' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
]

// Accesos fijos en la barra inferior según el rol. El resto queda en "Más".
const FIJOS_POR_ROL = {
  operario: ['/registrar', '/maquinas', '/repuestos'],
  mantenimiento: ['/', '/maquinas', '/repuestos'],
  admin: ['/', '/maquinas', '/repuestos'],
}

export default function BottomNav() {
  const { usuario, setUsuario } = useApp()
  const [masAbierto, setMasAbierto] = useState(false)

  const fijos = FIJOS_POR_ROL[usuario?.rol] || FIJOS_POR_ROL.admin
  const itemsFijos = fijos.map(to => TODOS.find(i => i.to === to)).filter(Boolean)
  const itemsMas = TODOS.filter(i => !fijos.includes(i.to))

  return (
    <>
      <nav className="bottom-nav">
        {itemsFijos.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="bottom-nav-item"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          className="bottom-nav-item"
          onClick={() => setMasAbierto(true)}
          style={{ color: masAbierto ? 'var(--accent)' : 'var(--text-secondary)', background: 'none', border: 'none' }}
        >
          <Menu size={20} />
          <span>Más</span>
        </button>
      </nav>

      {masAbierto && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setMasAbierto(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Más</h2>
              <button className="btn btn-ghost" onClick={() => setMasAbierto(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '8px' }}>
              {itemsMas.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMasAbierto(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', borderRadius: 8, marginBottom: 2,
                    textDecoration: 'none', fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent)' : 'var(--text)',
                    background: isActive ? 'rgba(88,166,255,0.1)' : 'transparent',
                  })}
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={() => { setUsuario(null); setMasAbierto(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '13px 14px', borderRadius: 8, marginTop: 8,
                  border: 'none', borderTop: '1px solid var(--border)', background: 'none',
                  fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <LogOut size={18} />
                Cambiar usuario
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bottom-nav {
          display: none;
        }
        @media (max-width: 767px) {
          .bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 40;
            background: var(--sidebar);
            border-top: 1px solid var(--border);
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
        }
        .bottom-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 8px 0 6px;
          text-decoration: none;
          font-size: 10px;
          cursor: pointer;
        }
      `}</style>
    </>
  )
}
