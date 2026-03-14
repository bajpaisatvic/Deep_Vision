import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function AllCases() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api.get('/cases/').then(res => {
      setCases(res.data.results || res.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? cases : cases.filter(c => c.status === filter)

  return (
    <div>
      <div className="page-header">
        <div><h1>All Cases</h1><p>View and manage all missing person reports</p></div>
      </div>

      <div className="filter-tabs">
        {['ALL', 'ACTIVE', 'FOUND', 'CLOSED'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><h3>No cases found</h3></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Age</th><th>Gender</th><th>Reported By</th><th>Last Seen</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><Link to={`/cases/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</Link></td>
                  <td>{c.age}</td>
                  <td>{c.gender}</td>
                  <td>{c.reported_by_username}</td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_seen_location || '—'}</td>
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
