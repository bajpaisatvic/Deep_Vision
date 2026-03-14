import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import {
  HiOutlineExclamationTriangle, HiOutlineFolderOpen,
  HiOutlineCheckCircle, HiOutlineShieldCheck
} from 'react-icons/hi2'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PoliceDashboard() {
  const [stats, setStats] = useState({ alerts: 0, pendingAlerts: 0, activeCases: 0, verified: 0 })
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, casesRes] = await Promise.all([
          api.get('/alerts/'),
          api.get('/cases/'),
        ])
        const alerts = alertsRes.data.results || alertsRes.data || []
        const cases = casesRes.data.results || casesRes.data || []
        const alertList = Array.isArray(alerts) ? alerts : []
        const caseList = Array.isArray(cases) ? cases : []

        setStats({
          alerts: alertList.length,
          pendingAlerts: alertList.filter(a => a.status === 'PENDING').length,
          activeCases: caseList.filter(c => c.status === 'ACTIVE').length,
          verified: alertList.filter(a => a.status === 'VERIFIED').length,
        })
        setRecentAlerts(alertList.slice(0, 5))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  // Mock chart data
  const chartData = [
    { day: 'Mon', alerts: 4 }, { day: 'Tue', alerts: 7 }, { day: 'Wed', alerts: 3 },
    { day: 'Thu', alerts: 8 }, { day: 'Fri', alerts: 5 }, { day: 'Sat', alerts: 9 },
    { day: 'Sun', alerts: 6 },
  ]

  return (
    <div>
      <div className="page-header">
        <div><h1>Police Dashboard</h1><p>Monitor alerts and missing person cases</p></div>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon red"><HiOutlineExclamationTriangle /></div>
          <div className="stat-info"><h3>{stats.pendingAlerts}</h3><p>Pending Alerts</p></div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon primary"><HiOutlineFolderOpen /></div>
          <div className="stat-info"><h3>{stats.activeCases}</h3><p>Active Cases</p></div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon green"><HiOutlineCheckCircle /></div>
          <div className="stat-info"><h3>{stats.verified}</h3><p>Verified Alerts</p></div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon cyan"><HiOutlineShieldCheck /></div>
          <div className="stat-info"><h3>{stats.alerts}</h3><p>Total Alerts</p></div>
        </div>
      </div>

      <div className="content-grid">
        {/* Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Alert Trend (This Week)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Area type="monotone" dataKey="alerts" stroke="#2563eb" fillOpacity={1} fill="url(#colorAlerts)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Alerts */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Recent Alerts</h3>
            <Link to="/police/alerts" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : recentAlerts.length === 0 ? (
            <div className="empty-state"><h3>No alerts yet</h3></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Person</th><th>Camera</th><th>Confidence</th><th>Status</th></tr></thead>
              <tbody>
                {recentAlerts.map(a => (
                  <tr key={a.id}>
                    <td><Link to={`/police/alerts/${a.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{a.missing_person_name}</Link></td>
                    <td>{a.camera_name}</td>
                    <td>{(a.confidence_score * 100).toFixed(0)}%</td>
                    <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
