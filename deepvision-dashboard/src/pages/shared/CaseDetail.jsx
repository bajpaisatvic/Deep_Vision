import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { HiOutlineCloudArrowUp } from 'react-icons/hi2'

export default function CaseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchCase = async () => {
    try {
      const res = await api.get(`/cases/${id}/`)
      setCaseData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCase() }, [id])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('is_primary', 'false')
      await api.post(`/cases/${id}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      fetchCase()
    } catch (err) { console.error(err) }
    finally { setUploading(false) }
  }

  const handleStatusUpdate = async (status) => {
    try {
      await api.patch(`/cases/${id}/status/`, { status })
      fetchCase()
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>
  if (!caseData) return <div className="empty-state"><h3>Case not found</h3></div>



  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{caseData.name}</h1>
          <p>Case #{caseData.id} — Reported {new Date(caseData.registered_at).toLocaleDateString()}</p>
        </div>
        <span className={`badge badge-${caseData.status.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
          {caseData.status}
        </span>
      </div>

      <div className="content-grid">
        {/* Case Info */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Details</h3>
          <div className="info-grid">
            <div className="info-item"><label>Age</label><span>{caseData.age}</span></div>
            <div className="info-item"><label>Gender</label><span>{caseData.gender}</span></div>
            <div className="info-item"><label>Last Seen Location</label><span>{caseData.last_seen_location || '—'}</span></div>
            <div className="info-item"><label>Last Seen Time</label><span>{caseData.last_seen_time ? new Date(caseData.last_seen_time).toLocaleString() : '—'}</span></div>
          </div>
          {caseData.description && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</label>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.9rem' }}>{caseData.description}</p>
            </div>
          )}

          {/* Police/Admin status controls */}
          {(user.role === 'POLICE' || user.role === 'ADMIN') && caseData.status === 'ACTIVE' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate('FOUND')}>Mark as Found</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleStatusUpdate('CLOSED')}>Close Case</button>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Photos</h3>
          </div>

          {caseData.images && caseData.images.length > 0 ? (
            <div className="image-gallery">
              {caseData.images.map(img => (
                <img
                  key={img.id}
                  src={img.image_url || img.image}
                  alt={caseData.name}
                  className={img.is_primary ? 'primary' : ''}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>No photos uploaded yet</p>
            </div>
          )}

          <div className="image-upload-zone" style={{ marginTop: '1rem' }} onClick={() => document.getElementById('case-image-upload').click()}>
            <input id="case-image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
            <div className="upload-icon"><HiOutlineCloudArrowUp /></div>
            <p>{uploading ? 'Uploading...' : 'Click to upload a photo'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
