import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Wrench, User, ChevronRight, Loader } from 'lucide-react'

export default function UserSelector() {
  const { setUsuario } = useApp()
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchUsuarios() {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, secciones(nombre)')
        .eq('activo', true)
        .order('nombre')
      if (error) setError(error.message)
      else setUsuarios(data || [])
      setLoading(false)
    }
    fetchUsuarios()
  }, [])

  const rolLabels = {
    admin: { label: 'Admin', color: 'var(--accent)' },
    mantenimiento: { label: 'Mantenimiento', color: 'var(--success)' },
    operario: { label: 'Operario', color: 'var(--text-secondary)' },
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: 'var(--sidebar)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wrench size={24} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mayor Tools</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Repuestos</div>
        </div>
      </div>

      <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 32 }}>
        Selecciona tu usuario para continuar
      </div>

      <div style={{ width: '100%', maxWidth: 380 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            Error al cargar usuarios: {error}
          </div>
        )}

        {!loading && !error && usuarios.map(u => {
          const rol = rolLabels[u.rol] || rolLabels.operario
          return (
            <button
              key={u.id}
              onClick={() => {
                setUsuario(u)
                const esMobile = window.innerWidth < 768
                navigate(esMobile && u.rol === 'operario' ? '/registrar' : '/')
              }}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '14px 16px',
                marginBottom: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'border-color 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--sidebar)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={18} color="var(--text-secondary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: 14 }}>{u.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {u.secciones?.nombre || '—'}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: rol.color,
                background: `${rol.color}22`,
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {rol.label}
              </span>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </button>
          )
        })}

        {!loading && !error && usuarios.length === 0 && (
          <div className="alert alert-warning">
            No hay usuarios configurados. Añade usuarios desde Supabase.
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: 'var(--text-secondary)' }}>
        Clasificación · Cerámica Mayor
      </div>
    </div>
  )
}
