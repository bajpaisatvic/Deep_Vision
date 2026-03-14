import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { HiOutlineFolderOpen, HiOutlineCheckCircle, HiOutlineMagnifyingGlass, HiOutlinePlusCircle } from 'react-icons/hi2'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, active: 0, found: 0 })
  const [recentCases, setRecentCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/cases/')
        const cases = res.data.results || res.data
        const caseList = Array.isArray(cases) ? cases : []
        setRecentCases(caseList.slice(0, 5))
        setStats({
          total: caseList.length,
          active: caseList.filter(c => c.status === 'ACTIVE').length,
          found: caseList.filter(c => c.status === 'FOUND').length,
        })
      } catch (err) {
        console.error('Failed to fetch cases:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Dashboard</h1>
          <p>Track your reported missing person cases</p>
        </div>
        <Link to="/report" className="btn btn-primary">
          <HiOutlinePlusCircle /> Report Missing Person
        </Link>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon primary"><HiOutlineFolderOpen /></div>
          <div className="stat-info"><h3>{stats.total}</h3><p>Total Cases</p></div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon orange"><HiOutlineMagnifyingGlass /></div>
          <div className="stat-info"><h3>{stats.active}</h3><p>Active Cases</p></div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon green"><HiOutlineCheckCircle /></div>
          <div className="stat-info"><h3>{stats.found}</h3><p>Found</p></div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Recent Cases</h3>
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : recentCases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No cases yet</h3>
            <p>Report a missing person to get started</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Age</th><th>Gender</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentCases.map(c => (
                <tr key={c.id}>
                  <td><Link to={`/cases/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</Link></td>
                  <td>{c.age}</td>
                  <td>{c.gender}</td>
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
