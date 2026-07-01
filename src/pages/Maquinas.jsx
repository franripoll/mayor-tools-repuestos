import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Plus, Wrench, Edit2, ChevronDown, ChevronRight, Upload, FileText, X, GitBranch } from 'lucide-react'

export default function Maquinas() {
  const { toast } = useApp()
  const [maquinas, setMaquinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | 'new-sub-{id}' | maquina
  const [expandidas, setExpandidas] = useState({})

  async function fetchMaquinas() {
    const { data, error } = await supabase
      .from('maquinas')
      .select('*, secciones(nombre), repuesto_maquinas(count)')
      .eq('activa', true)
      .order('nombre')
    if (error) { toast.error('Error al cargar máquinas'); return }
    setMaquinas(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchMaquinas() }, [])

  // Separar principales y submáquinas
  const principales = maquinas.filter(m => !m.parent_id)
  const subMap = maquinas.reduce((acc, m) => {
    if (m.parent_id) {
      if (!acc[m.parent_id]) acc[m.parent_id] = []
      acc[m.parent_id].push(m)
    }
    return acc
  }, {})

  function toggleExpand(id) {
    setExpandidas(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function MaquinaCard({ maquina, nivel = 0 }) {
    const subs = subMap[maquina.id] || []
    const isExpanded = expandidas[maquina.id]
    const hasSubs = subs.length > 0

    return (
      <div style={{ marginBottom: nivel === 0 ? 8 : 0 }}>
        <div
          className="card"
          style={{
            marginLeft: nivel * 24,
            borderLeft: nivel > 0 ? `2px solid var(--accent)` : undefined,
            borderRadius: nivel > 0 ? '0 8px 8px 0' : 8,
            padding: '12px 14px',
            marginBottom: nivel > 0 ? 4 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Expand toggle */}
            <button
              onClick={() => hasSubs && toggleExpand(maquina.id)}
              style={{
                background: 'none', border: 'none', cursor: hasSubs ? 'pointer' : 'default',
                color: hasSubs ? 'var(--accent)' : 'transparent', padding: 2, flexShrink: 0,
              }}
            >
              {hasSubs
                ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)
                : <span style={{ width: 16, display: 'inline-block' }} />
              }
            </button>

            {/* Icono */}
            <div style={{
              width: 32, height: 32, borderRadius: 7, flexShrink: 0,
              background: nivel === 0 ? 'rgba(88,166,255,0.1)' : 'rgba(88,166,255,0.06)',
              border: `1px solid ${nivel === 0 ? 'rgba(88,166,255,0.2)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {nivel === 0
                ? <Wrench size={15} color="var(--accent)" />
                : <GitBranch size={13} color="var(--text-secondary)" />
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: nivel === 0 ? 600 : 500, fontSize: nivel === 0 ? 14 : 13 }}>
                {maquina.nombre}
              </div>
              {(maquina.marca || maquina.modelo) && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {[maquina.marca, maquina.modelo].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {maquina.ubicacion && (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📍 {maquina.ubicacion}</span>
              )}
              {hasSubs && (
                <span className="badge badge-accent">{subs.length} partes</span>
              )}
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {maquina.repuesto_maquinas?.[0]?.count || 0} repuestos
              </span>
              {/* Añadir subparte (solo en nivel 0) */}
              {nivel === 0 && (
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={() => setModal({ type: 'new-sub', parentId: maquina.id, parentNombre: maquina.nombre })}
                  title="Añadir parte/submáquina"
                >
                  <Plus size={12} /> Parte
                </button>
              )}
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setModal({ type: 'edit', maquina })}>
                <Edit2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Submáquinas */}
        {hasSubs && isExpanded && (
          <div style={{ marginTop: 4 }}>
            {subs.map(sub => (
              <MaquinaCard key={sub.id} maquina={sub} nivel={nivel + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Máquinas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            {principales.length} máquinas · {maquinas.length - principales.length} partes/submáquinas
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'new' })}>
          <Plus size={16} /> Nueva máquina
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : principales.length === 0 ? (
        <div className="empty-state">
          <Wrench size={40} />
          <div style={{ fontWeight: 500 }}>No hay máquinas registradas</div>
          <div style={{ fontSize: 12 }}>Crea tu primera máquina con el botón de arriba</div>
        </div>
      ) : (
        <div>
          {principales.map(m => (
            <MaquinaCard key={m.id} maquina={m} nivel={0} />
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalMaquina
          tipo={modal.type}
          maquina={modal.type === 'edit' ? modal.maquina : null}
          parentId={modal.parentId || null}
          parentNombre={modal.parentNombre || null}
          maquinasPrincipales={principales}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            fetchMaquinas()
            // Auto-expandir la máquina padre al añadir una parte
            if (modal.parentId) setExpandidas(prev => ({ ...prev, [modal.parentId]: true }))
          }}
        />
      )}
    </div>
  )
}

function ModalMaquina({ tipo, maquina, parentId, parentNombre, maquinasPrincipales, onClose, onSaved }) {
  const { toast } = useApp()
  const esSubMaquina = tipo === 'new-sub' || (maquina && maquina.parent_id)
  const [form, setForm] = useState({
    nombre: maquina?.nombre || '',
    marca: maquina?.marca || '',
    modelo: maquina?.modelo || '',
    numero_serie: maquina?.numero_serie || '',
    anyo: maquina?.anyo || '',
    ubicacion: maquina?.ubicacion || '',
    notas: maquina?.notas || '',
    parent_id: maquina?.parent_id || parentId || '',
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

  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  async function handleDoc(e) {
    const file = e.target.files[0]
    if (!file || !maquina) return
    setDocCargando(true)
    const ext = file.name.split('.').pop()
    const fileName = `${maquina.id}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('maquina-documentos').upload(fileName, file)
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('maquina-documentos').getPublicUrl(fileName)
      const tipoDoc = ['pdf', 'dwg', 'dxf'].includes(ext.toLowerCase()) ? 'plano' : 'otro'
      await supabase.from('maquina_documentos').insert({ maquina_id: maquina.id, tipo: tipoDoc, nombre: file.name, url: publicUrl })
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
        parent_id: form.parent_id || null,
      }
      if (maquina) {
        await supabase.from('maquinas').update(payload).eq('id', maquina.id)
        toast.success('Máquina actualizada')
      } else {
        await supabase.from('maquinas').insert(payload)
        toast.success(payload.parent_id ? 'Parte añadida' : 'Máquina creada')
      }
      onSaved()
    } catch (e) {
      toast.error(e.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const titulo = maquina
    ? (maquina.parent_id ? 'Editar parte' : 'Editar máquina')
    : (parentId ? `Nueva parte — ${parentNombre}` : 'Nueva máquina')

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{titulo}</h2>
            {parentId && !maquina && (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
                Submáquina de: {parentNombre}
              </div>
            )}
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder={parentId ? 'Ej: Apilador, Rodillera, Flejadora...' : 'Nombre de la máquina'} />
          </div>

          {/* Si es nueva y no tiene parent fijo, permitir elegir si es submáquina */}
          {tipo === 'new' && (
            <div className="form-group">
              <label className="form-label">Parte de (opcional)</label>
              <select value={form.parent_id} onChange={e => set('parent_id', e.target.value)}>
                <option value="">Máquina principal (sin padre)</option>
                {maquinasPrincipales.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                Déjalo vacío si es una máquina principal
              </div>
            </div>
          )}

          {!form.parent_id && (
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
          )}

          {!form.parent_id && (
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
          )}

          <div className="form-group">
            <label className="form-label">Ubicación</label>
            <input value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)}
              placeholder="Ej: Nave 2, línea B" />
          </div>

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={2} style={{ resize: 'vertical' }} />
          </div>

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
            {maquina ? 'Guardar cambios' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
