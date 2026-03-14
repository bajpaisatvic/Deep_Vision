import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function MyCases() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/cases/').then(res => {
      setCases(res.data.results || res.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h1>My Cases</h1><p>All missing person cases you have reported</p></div>
        <Link to="/report" className="btn btn-primary">+ New Report</Link>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {cases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No cases reported yet</h3>
            <p>Click "New Report" to register a missing person.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Age</th><th>Gender</th><th>Last Seen</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.id}>
                  <td><Link to={`/cases/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</Link></td>
                  <td>{c.age}</td>
                  <td>{c.gender}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_seen_location || '—'}</td>
                  <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td>{new Date(c.registered_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
