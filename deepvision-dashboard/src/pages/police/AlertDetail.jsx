import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2'

export default function AlertDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    api.get(`/alerts/${id}/`).then(res => setAlert(res.data))
      .catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleVerify = async (status) => {
    setActing(true)
    try {
      const res = await api.patch(`/alerts/${id}/verify/`, { status })
      setAlert(res.data)
    } catch (err) { console.error(err) }
    finally { setActing(false) }
  }

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>
  if (!alert) return <div className="empty-state"><h3>Alert not found</h3></div>

  const BASE_URL = 'http://127.0.0.1:8000'  // fallback if snapshot is relative
  const confidence = alert.confidence_score || 0
  const snapshotSrc = alert.snapshot_url || (alert.snapshot ? `${BASE_URL}${alert.snapshot}` : null)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alert #{alert.id}</h1>
          <p>Detected {new Date(alert.detected_at).toLocaleString()}</p>
        </div>
        <span className={`badge badge-${alert.status.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
          {alert.status}
        </span>
      </div>

      <div className="alert-detail-grid">
        {/* Snapshot */}
        <div className="glass-card">
          <div className="snapshot-container">
            {snapshotSrc ? (
              <img src={snapshotSrc} alt="Detection snapshot" />
            ) : (
              <div className="empty-state" style={{ padding: '3rem' }}><p>No snapshot available</p></div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Match Details</h3>

          <div className="info-grid">
            <div className="info-item">
              <label>Missing Person</label>
              <span>{alert.missing_person?.name || '—'}</span>
            </div>
            <div className="info-item">
              <label>Age / Gender</label>
              <span>{alert.missing_person?.age || '—'} / {alert.missing_person?.gender || '—'}</span>
            </div>
            <div className="info-item">
              <label>Camera</label>
              <span>{alert.camera?.name || '—'}</span>
            </div>
            <div className="info-item">
              <label>Camera Location</label>
              <span>{alert.camera?.location_name || '—'}</span>
            </div>
          </div>

          {/* Confidence */}
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confidence Score</label>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: confidence > 0.8 ? 'var(--accent-green)' : confidence > 0.6 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="confidence-bar">
              <div className="confidence-bar-fill" style={{ width: `${confidence * 100}%` }} />
            </div>
          </div>

          {/* Verification Info */}
          {alert.verified_by && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>{alert.status}</strong> by {alert.verified_by?.username} on {new Date(alert.verified_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* Actions */}
          {alert.status === 'PENDING' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-success" onClick={() => handleVerify('VERIFIED')} disabled={acting}>
                <HiOutlineCheckCircle /> Verify Match
              </button>
              <button className="btn btn-danger" onClick={() => handleVerify('DISMISSED')} disabled={acting}>
                <HiOutlineXCircle /> Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
