import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Plus, Search, Wrench, Edit2, FileText, Image, X, Upload } from 'lucide-react'

export default function Maquinas() {
  const { toast } = useApp()
  const [maquinas, setMaquinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  async function fetchMaquinas() {
    const { data, error } = await supabase
      .from('maquinas')
      .select('*, secciones(nombre), repuesto_maquinas(count)')
      .eq('activa', true)
      .order('nombre')
    if (error) toast.error('Error al cargar máquinas')
    else setMaquinas(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchMaquinas() }, [])

  const filtered = maquinas.filter(m =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (m.marca || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.modelo || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Máquinas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{maquinas.length} máquinas registradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={16} /> Nueva máquina</button>
      </div>

      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar máquina..." style={{ paddingLeft: 32 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60, gridColumn: '1/-1' }}><div className="spinner" /></div>}
        {!loading && filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <Wrench size={40} />
            <div style={{ fontWeight: 500 }}>No hay máquinas</div>
          </div>
        )}
        {filtered.map(m => (
          <div key={m.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setModal(m)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'rgba(88,166,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wrench size={18} color="var(--accent)" />
              </div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={e => { e.stopPropagation(); setModal(m) }}>
                <Edit2 size={14} />
              </button>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{m.nombre}</div>
            {(m.marca || m.modelo) && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {[m.marca, m.modelo].filter(Boolean).join(' · ')}
              </div>
            )}
            {m.ubicacion && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {m.ubicacion}</div>
            )}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)' }}>
              {m.repuesto_maquinas?.[0]?.count || 0} repuestos asociados
            </div>
          </div>
        ))}
      </div>

      {modal !== null && (
        <ModalMaquina
          maquina={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchMaquinas() }}
        />
      )}
    </div>
  )
}

function ModalMaquina({ maquina, onClose, onSaved }) {
  const { toast } = useApp()
  const [form, setForm] = useState({
    nombre: maquina?.nombre || '',
    marca: maquina?.marca || '',
    modelo: maquina?.modelo || '',
    numero_serie: maquina?.numero_serie || '',
    anyo: maquina?.anyo || '',
    ubicacion: maquina?.ubicacion || '',
    notas: maquina?.notas || '',
  })
  const [loading, setLoading] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [docCargando, setDocCargando] = useState(false)

  useEffect(() => {
    if (maquina) {
      supabase.from('maquina_documentos').select('*').eq('maquina_id', maquina.id)
        .then(({ data }) => setDocumentos(data || []))
    }
  }, [maquina])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleDoc(e) {
    const file = e.target.files[0]
    if (!file || !maquina) return
    setDocCargando(true)
    const ext = file.name.split('.').pop()
    const fileName = `${maquina.id}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('maquina-documentos').upload(fileName, file)
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('maquina-documentos').getPublicUrl(fileName)
      const tipo = ['pdf', 'dwg', 'dxf'].includes(ext.toLowerCase()) ? 'plano' : 'otro'
      await supabase.from('maquina_documentos').insert({ maquina_id: maquina.id, tipo, nombre: file.name, url: publicUrl })
      const { data } = await supabase.from('maquina_documentos').select('*').eq('maquina_id', maquina.id)
      setDocumentos(data || [])
      toast.success('Documento subido')
    }
    setDocCargando(false)
  }

  async function handleSubmit() {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        marca: form.marca || null,
        modelo: form.modelo || null,
        numero_serie: form.numero_serie || null,
        anyo: form.anyo ? parseInt(form.anyo) : null,
        ubicacion: form.ubicacion || null,
        notas: form.notas || null,
      }
      if (maquina) {
        await supabase.from('maquinas').update(payload).eq('id', maquina.id)
      } else {
        await supabase.from('maquinas').insert(payload)
      }
      toast.success(maquina ? 'Máquina actualizada' : 'Máquina creada')
      onSaved()
    } catch (e) {
      toast.error(e.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{maquina ? 'Editar máquina' : 'Nueva máquina'}</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre de la máquina" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Marca</label>
              <input value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Fabricante" />
            </div>
            <div className="form-group">
              <label className="form-label">Modelo</label>
              <input value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Modelo" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Número de serie</label>
              <input value={form.numero_serie} onChange={e => set('numero_serie', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Año</label>
              <input type="number" value={form.anyo} onChange={e => set('anyo', e.target.value)} placeholder="2020" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Ubicación</label>
            <input value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)} placeholder="Ej: Nave 2, línea B" />
          </div>
          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
          </div>

          {/* Documentos (solo en edición) */}
          {maquina && (
            <div className="form-group">
              <label className="form-label">Documentos / Planos</label>
              <div style={{ marginBottom: 8 }}>
                {documentos.map(d => (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', background: 'var(--bg)',
                    borderRadius: 6, border: '1px solid var(--border)', marginBottom: 6,
                  }}>
                    <FileText size={14} color="var(--text-secondary)" />
                    <a href={d.url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', flex: 1 }}>
                      {d.nombre}
                    </a>
                    <span className="badge badge-neutral">{d.tipo}</span>
                  </div>
                ))}
              </div>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 6,
                cursor: 'pointer', fontSize: 13,
              }}>
                <Upload size={14} />
                {docCargando ? 'Subiendo...' : 'Subir documento'}
                <input type="file" onChange={handleDoc} style={{ display: 'none' }} disabled={docCargando} />
              </label>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            {maquina ? 'Guardar cambios' : 'Crear máquina'}
          </button>
        </div>
      </div>
    </div>
  )
}
