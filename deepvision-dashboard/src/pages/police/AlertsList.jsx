import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function AlertsList() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api.get('/alerts/').then(res => {
      setAlerts(res.data.results || res.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.status === filter)

  return (
    <div>
      <div className="page-header">
        <div><h1>Detection Alerts</h1><p>Face match alerts from CCTV surveillance</p></div>
      </div>

      <div className="filter-tabs">
        {['ALL', 'PENDING', 'VERIFIED', 'DISMISSED'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No alerts found</h3>
            <p>Alerts appear when the system detects a face match</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Missing Person</th><th>Camera</th><th>Confidence</th><th>Detected</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.missing_person_name}</td>
                  <td>{a.camera_name}</td>
                  <td>
                    <span style={{ color: a.confidence_score > 0.8 ? 'var(--accent-green)' : a.confidence_score > 0.6 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
                      {(a.confidence_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td>{new Date(a.detected_at).toLocaleString()}</td>
                  <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                  <td><Link to={`/police/alerts/${a.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
