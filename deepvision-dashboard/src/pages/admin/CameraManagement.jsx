import { useState, useEffect } from 'react'
import api from '../../services/api'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineXMark } from 'react-icons/hi2'

const emptyForm = { name: '', location_name: '', latitude: '', longitude: '', stream_url: '', zone: '', is_active: true }

export default function CameraManagement() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const fetchCameras = () => {
    api.get('/cameras/').then(res => {
      setCameras(res.data.results || res.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchCameras() }, [])

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  const openAdd = () => { setEditId(null); setForm(emptyForm); setError(''); setShowModal(true) }

  const openEdit = (cam) => {
    setEditId(cam.id)
    setForm({
      name: cam.name, location_name: cam.location_name || '',
      latitude: cam.latitude, longitude: cam.longitude,
      stream_url: cam.stream_url, zone: cam.zone || '', is_active: cam.is_active,
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = { ...form, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) }
    try {
      if (editId) {
        await api.patch(`/cameras/${editId}/`, payload)
      } else {
        await api.post('/cameras/', payload)
      }
      setShowModal(false)
      fetchCameras()
    } catch (err) {
      const msg = err.response?.data
      setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Failed to save camera.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this camera?')) return
    try {
      await api.delete(`/cameras/${id}/`)
      fetchCameras()
    } catch (err) { console.error(err) }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Camera Management</h1><p>Manage CCTV cameras connected to the system</p></div>
        <button className="btn btn-primary" onClick={openAdd}><HiOutlinePlus /> Add Camera</button>
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /></div>
      ) : cameras.length === 0 ? (
        <div className="glass-card empty-state" style={{ padding: '3rem' }}>
          <div className="empty-state-icon">📹</div>
          <h3>No cameras registered</h3>
          <p>Add your first CCTV camera to start surveillance</p>
        </div>
      ) : (
        <div className="camera-grid">
          {cameras.map(cam => (
            <div key={cam.id} className="glass-card camera-card">
              <div className="camera-card-header">
                <h3>{cam.name}</h3>
                <span className={`badge ${cam.is_active ? 'badge-active' : 'badge-closed'}`}>
                  {cam.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="camera-card-body">
                <p>📍 {cam.location_name || 'No location'}</p>
                <p>🏷️ Zone: {cam.zone || '—'}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  ({cam.latitude}, {cam.longitude})
                </p>
              </div>
              <div className="camera-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cam)}><HiOutlinePencil /> Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cam.id)}><HiOutlineTrash /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Camera' : 'Add Camera'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><HiOutlineXMark /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Camera Name *</label>
                  <input name="name" className="form-input" value={form.name} onChange={handleChange} required placeholder="e.g. Main Gate Camera" />
                </div>
                <div className="form-group">
                  <label className="form-label">Location Name</label>
                  <input name="location_name" className="form-input" value={form.location_name} onChange={handleChange} placeholder="e.g. Building A Entrance" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Latitude *</label>
                    <input name="latitude" type="number" step="any" className="form-input" value={form.latitude} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude *</label>
                    <input name="longitude" type="number" step="any" className="form-input" value={form.longitude} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Stream URL *</label>
                  <input name="stream_url" type="url" className="form-input" value={form.stream_url} onChange={handleChange} required placeholder="rtsp://..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Zone</label>
                  <input name="zone" className="form-input" value={form.zone} onChange={handleChange} placeholder="Zone A" />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                  <input name="is_active" type="checkbox" checked={form.is_active} onChange={handleChange} id="cam-active" />
                  <label htmlFor="cam-active" className="form-label" style={{ margin: 0 }}>Camera is active</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Camera'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
