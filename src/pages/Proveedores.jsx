import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Plus, Truck, Edit2, X, Search } from 'lucide-react'

export default function Proveedores() {
  const { toast } = useApp()
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  async function fetchProveedores() {
    const { data } = await supabase.from('proveedores').select('*').eq('activo', true).order('nombre')
    setProveedores(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProveedores() }, [])

  const filtered = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.contacto || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Proveedores</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{proveedores.length} proveedores</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={16} /> Nuevo proveedor</button>
      </div>

      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proveedor..." style={{ paddingLeft: 32 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {loading && <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>}
        {!loading && filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <Truck size={40} />
            <div style={{ fontWeight: 500 }}>No hay proveedores</div>
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(240,136,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={18} color="var(--alert)" />
              </div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setModal(p)}><Edit2 size={14} /></button>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{p.nombre}</div>
            {p.contacto && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>👤 {p.contacto}</div>}
            {p.email && <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 2 }}>{p.email}</div>}
            {p.telefono && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📞 {p.telefono}</div>}
          </div>
        ))}
      </div>

      {modal !== null && (
        <ModalProveedor
          proveedor={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchProveedores() }}
        />
      )}
    </div>
  )
}

function ModalProveedor({ proveedor, onClose, onSaved }) {
  const { toast } = useApp()
  const [form, setForm] = useState({
    nombre: proveedor?.nombre || '',
    contacto: proveedor?.contacto || '',
    email: proveedor?.email || '',
    telefono: proveedor?.telefono || '',
    direccion: proveedor?.direccion || '',
    notas: proveedor?.notas || '',
  })
  const [loading, setLoading] = useState(false)
  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  async function handleSubmit() {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    try {
      const payload = { nombre: form.nombre.trim(), contacto: form.contacto || null, email: form.email || null, telefono: form.telefono || null, direccion: form.direccion || null, notas: form.notas || null }
      if (proveedor) await supabase.from('proveedores').update(payload).eq('id', proveedor.id)
      else await supabase.from('proveedores').insert(payload)
      toast.success(proveedor ? 'Proveedor actualizado' : 'Proveedor creado')
      onSaved()
    } catch (e) { toast.error('Error al guardar') } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Nombre *</label><input value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Persona de contacto</label><input value={form.contacto} onChange={e => set('contacto', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Teléfono</label><input value={form.telefono} onChange={e => set('telefono', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Dirección</label><input value={form.direccion} onChange={e => set('direccion', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Notas</label><textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} style={{ resize: 'vertical' }} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            {proveedor ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
