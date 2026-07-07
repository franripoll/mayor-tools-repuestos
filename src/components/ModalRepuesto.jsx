import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { X, Upload, Trash2 } from 'lucide-react'

export default function ModalRepuesto({ repuesto, onClose, onSaved }) {
  const { toast } = useApp()
  const [form, setForm] = useState({
    nombre: '', descripcion: '', referencia_fabricante: '',
    referencia_interna: '', ubicacion_almacen: '',
    stock_actual: 0, stock_minimo: 1,
    critico: false, proveedor_id: '',
    coste_unitario: '', coste_visible: false,
  })
  const [maquinas, setMaquinas] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [maquinasSeleccionadas, setMaquinasSeleccionadas] = useState([])
  const [loading, setLoading] = useState(false)
  const [imagen, setImagen] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const [{ data: maq }, { data: prov }] = await Promise.all([
        supabase.from('maquinas').select('id, nombre').eq('activa', true).order('nombre'),
        supabase.from('proveedores').select('id, nombre').eq('activo', true).order('nombre'),
      ])
      setMaquinas(maq || [])
      setProveedores(prov || [])

      if (repuesto) {
        setForm({
          nombre: repuesto.nombre || '',
          descripcion: repuesto.descripcion || '',
          referencia_fabricante: repuesto.referencia_fabricante || '',
          referencia_interna: repuesto.referencia_interna || '',
          ubicacion_almacen: repuesto.ubicacion_almacen || '',
          stock_actual: repuesto.stock_actual ?? 0,
          stock_minimo: repuesto.stock_minimo ?? 1,
          critico: repuesto.critico || false,
          proveedor_id: repuesto.proveedor_id || '',
          coste_unitario: repuesto.coste_unitario || '',
          coste_visible: repuesto.coste_visible || false,
        })
        // Cargar máquinas asociadas
        const { data: rm } = await supabase
          .from('repuesto_maquinas').select('maquina_id').eq('repuesto_id', repuesto.id)
        setMaquinasSeleccionadas((rm || []).map(r => r.maquina_id))
      }
    }
    fetchData()
  }, [repuesto])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleMaquina(id) {
    setMaquinasSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  function handleImagen(e) {
    const file = e.target.files[0]
    if (!file) return
    setImagen(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)

    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion || null,
        referencia_fabricante: form.referencia_fabricante || null,
        referencia_interna: form.referencia_interna || null,
        ubicacion_almacen: form.ubicacion_almacen || null,
        stock_actual: parseInt(form.stock_actual) || 0,
        stock_minimo: parseInt(form.stock_minimo) || 1,
        critico: form.critico,
        proveedor_id: form.proveedor_id || null,
        coste_unitario: form.coste_unitario ? parseFloat(form.coste_unitario) : null,
        coste_visible: form.coste_visible,
      }

      let repuestoId = repuesto?.id
      if (repuesto) {
        const { error } = await supabase.from('repuestos').update(payload).eq('id', repuesto.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('repuestos').insert(payload).select().single()
        if (error) throw error
        repuestoId = data.id
      }

      // Actualizar máquinas asociadas, conservando cantidad_recomendada y posicion
      // ya existentes (para no perder los datos importados desde catálogo al editar).
      const { data: existentes } = await supabase
        .from('repuesto_maquinas')
        .select('maquina_id, cantidad_recomendada, posicion')
        .eq('repuesto_id', repuestoId)
      const existentesMap = {}
      ;(existentes || []).forEach(e => { existentesMap[e.maquina_id] = e })

      await supabase.from('repuesto_maquinas').delete().eq('repuesto_id', repuestoId)
      if (maquinasSeleccionadas.length > 0) {
        await supabase.from('repuesto_maquinas').insert(
          maquinasSeleccionadas.map(maquina_id => ({
            repuesto_id: repuestoId,
            maquina_id,
            cantidad_recomendada: existentesMap[maquina_id]?.cantidad_recomendada ?? 1,
            posicion: existentesMap[maquina_id]?.posicion ?? null,
          }))
        )
      }

      // Subir imagen si hay una nueva
      if (imagen) {
        const ext = imagen.name.split('.').pop()
        const fileName = `${repuestoId}-${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('repuesto-imagenes')
          .upload(fileName, imagen, { upsert: true })
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('repuesto-imagenes').getPublicUrl(fileName)
          await supabase.from('repuesto_imagenes').insert({
            repuesto_id: repuestoId, url: publicUrl, es_principal: true
          })
        }
      }

      toast.success(repuesto ? 'Repuesto actualizado' : 'Repuesto creado')
      onSaved()
    } catch (e) {
      toast.error(e.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            {repuesto ? 'Editar repuesto' : 'Nuevo repuesto'}
          </h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Nombre */}
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Rodamiento 6205" />
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Descripción opcional..." rows={2} style={{ resize: 'vertical' }} />
          </div>

          {/* Referencias */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ref. fabricante</label>
              <input value={form.referencia_fabricante} onChange={e => set('referencia_fabricante', e.target.value)} placeholder="Ref. del fabricante" />
            </div>
            <div className="form-group">
              <label className="form-label">Ref. interna</label>
              <input value={form.referencia_interna} onChange={e => set('referencia_interna', e.target.value)} placeholder="Ref. interna" />
            </div>
          </div>

          {/* Ubicación almacén */}
          <div className="form-group">
            <label className="form-label">Ubicación en almacén</label>
            <input value={form.ubicacion_almacen} onChange={e => set('ubicacion_almacen', e.target.value)} placeholder="Ej: Estantería B, cajón 3" />
          </div>

          {/* Stock */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stock actual</label>
              <input type="number" min="0" value={form.stock_actual} onChange={e => set('stock_actual', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Stock mínimo (alerta)</label>
              <input type="number" min="0" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} />
            </div>
          </div>

          {/* Proveedor */}
          <div className="form-group">
            <label className="form-label">Proveedor</label>
            <select value={form.proveedor_id} onChange={e => set('proveedor_id', e.target.value)}>
              <option value="">Sin proveedor asignado</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          {/* Opciones */}
          <div className="form-group">
            <label className="form-label">Opciones</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={form.critico} onChange={e => set('critico', e.target.checked)}
                  style={{ width: 'auto', accentColor: 'var(--danger)' }} />
                <span>Repuesto crítico</span>
              </label>
            </div>
          </div>

          {/* Máquinas asociadas */}
          <div className="form-group">
            <label className="form-label">Máquinas asociadas</label>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              padding: 12, background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)',
              maxHeight: 150, overflowY: 'auto',
            }}>
              {maquinas.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>No hay máquinas registradas</span>}
              {maquinas.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMaquina(m.id)}
                  className={`btn ${maquinasSeleccionadas.includes(m.id) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  {m.nombre}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Sin selección = almacén central únicamente
            </div>
          </div>

          {/* Imagen */}
          <div className="form-group">
            <label className="form-label">Foto del repuesto</label>
            {imagenPreview && (
              <img src={imagenPreview} alt="Preview"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }} />
            )}
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, color: 'var(--text)',
            }}>
              <Upload size={14} />
              {imagenPreview ? 'Cambiar imagen' : 'Subir imagen'}
              <input type="file" accept="image/*" onChange={handleImagen} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            {repuesto ? 'Guardar cambios' : 'Crear repuesto'}
          </button>
        </div>
      </div>
    </div>
  )
}
