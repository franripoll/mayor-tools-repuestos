import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Plus, Settings, User, Layers, X, Edit2 } from 'lucide-react'

export default function Configuracion() {
  const { toast } = useApp()
  const [tab, setTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [secciones, setSecciones] = useState([])
  const [modalUsuario, setModalUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    const [{ data: u }, { data: s }] = await Promise.all([
      supabase.from('usuarios').select('*, secciones(nombre)').order('nombre'),
      supabase.from('secciones').select('*').order('nombre'),
    ])
    setUsuarios(u || [])
    setSecciones(s || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const ROL_LABELS = { admin: 'Admin', mantenimiento: 'Mantenimiento', operario: 'Operario' }
  const ROL_COLORS = { admin: 'var(--accent)', mantenimiento: 'var(--success)', operario: 'var(--text-secondary)' }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Configuración</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Usuarios, secciones y ajustes generales</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { id: 'usuarios', label: 'Usuarios', icon: <User size={14} /> },
          { id: 'secciones', label: 'Secciones', icon: <Layers size={14} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Usuarios */}
      {tab === 'usuarios' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={() => setModalUsuario('new')}><Plus size={16} /> Nuevo usuario</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div> :
              usuarios.map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(88,166,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                      {u.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{u.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.secciones?.nombre || 'Sin sección'}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: ROL_COLORS[u.rol],
                    background: `${ROL_COLORS[u.rol]}22`,
                    padding: '2px 8px', borderRadius: 10,
                  }}>
                    {ROL_LABELS[u.rol]}
                  </span>
                  <span className={`badge ${u.activo ? 'badge-success' : 'badge-neutral'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setModalUsuario(u)}>
                    <Edit2 size={14} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Secciones */}
      {tab === 'secciones' && (
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {secciones.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(63,185,80,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Layers size={16} color="var(--success)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{s.nombre}</div>
                  {s.descripcion && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.descripcion}</div>}
                </div>
                <span className={`badge ${s.activa ? 'badge-success' : 'badge-neutral'}`}>
                  {s.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
            Las secciones se gestionan desde Supabase directamente. Próximamente se podrán editar desde aquí.
          </p>
        </div>
      )}

      {modalUsuario !== null && (
        <ModalUsuario
          usuario={modalUsuario === 'new' ? null : modalUsuario}
          secciones={secciones}
          onClose={() => setModalUsuario(null)}
          onSaved={() => { setModalUsuario(null); fetchAll() }}
        />
      )}
    </div>
  )
}

function ModalUsuario({ usuario, secciones, onClose, onSaved }) {
  const { toast } = useApp()
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    rol: usuario?.rol || 'operario',
    seccion_id: usuario?.seccion_id || '',
    activo: usuario?.activo ?? true,
  })
  const [loading, setLoading] = useState(false)
  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit() {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    try {
      const payload = { nombre: form.nombre.trim(), rol: form.rol, seccion_id: form.seccion_id || null, activo: form.activo }
      if (usuario) await supabase.from('usuarios').update(payload).eq('id', usuario.id)
      else await supabase.from('usuarios').insert(payload)
      toast.success(usuario ? 'Usuario actualizado' : 'Usuario creado')
      onSaved()
    } catch (e) { toast.error('Error al guardar') } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{usuario ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Nombre *</label><input value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
          <div className="form-group">
            <label className="form-label">Rol</label>
            <select value={form.rol} onChange={e => set('rol', e.target.value)}>
              <option value="operario">Operario</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sección</label>
            <select value={form.seccion_id} onChange={e => set('seccion_id', e.target.value)}>
              <option value="">Sin sección</option>
              {secciones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 'auto', accentColor: 'var(--accent)' }} />
              Usuario activo
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            {usuario ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
