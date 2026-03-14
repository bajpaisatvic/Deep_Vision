import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  HiOutlineUsers, HiOutlineVideoCamera,
  HiOutlineExclamationTriangle, HiOutlineFolderOpen
} from 'react-icons/hi2'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ cases: 0, alerts: 0, cameras: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, alertsRes, camerasRes] = await Promise.all([
          api.get('/cases/'),
          api.get('/alerts/'),
          api.get('/cameras/'),
        ])
        const cases = casesRes.data.results || casesRes.data || []
        const alerts = alertsRes.data.results || alertsRes.data || []
        const cameras = camerasRes.data.results || camerasRes.data || []
        setStats({
          cases: cases.length,
          alerts: alerts.length,
          cameras: cameras.length,
          pending: Array.isArray(alerts) ? alerts.filter(a => a.status === 'PENDING').length : 0,
        })
      } catch (err) { console.error(err) }

      try {
        const healthRes = await api.get('/health/')
        setHealth(healthRes.data)
      } catch { setHealth({ status: 'error' }) }

      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div>
      <div className="page-header">
        <div><h1>Admin Dashboard</h1><p>System-wide overview and health monitoring</p></div>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon primary"><HiOutlineFolderOpen /></div>
          <div className="stat-info"><h3>{stats.cases}</h3><p>Total Cases</p></div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon red"><HiOutlineExclamationTriangle /></div>
          <div className="stat-info"><h3>{stats.pending}</h3><p>Pending Alerts</p></div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon cyan"><HiOutlineVideoCamera /></div>
          <div className="stat-info"><h3>{stats.cameras}</h3><p>Cameras</p></div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon orange"><HiOutlineUsers /></div>
          <div className="stat-info"><h3>{stats.alerts}</h3><p>Total Alerts</p></div>
        </div>
      </div>

      {/* System Health */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>System Health</h3>
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : health ? (
          <div className="info-grid">
            <div className="info-item">
              <label>Overall Status</label>
              <span style={{ color: health.status === 'healthy' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {health.status?.toUpperCase()}
              </span>
            </div>
            <div className="info-item">
              <label>Database</label>
              <span style={{ color: health.database === 'ok' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {health.database?.toUpperCase()}
              </span>
            </div>
            <div className="info-item">
              <label>Redis</label>
              <span style={{ color: health.redis === 'ok' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {health.redis?.toUpperCase()}
              </span>
            </div>
            <div className="info-item">
              <label>Celery</label>
              <span style={{ color: health.celery === 'ok' ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                {health.celery?.toUpperCase()}
              </span>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Unable to fetch health status</p>
        )}
      </div>
    </div>
  )
}
