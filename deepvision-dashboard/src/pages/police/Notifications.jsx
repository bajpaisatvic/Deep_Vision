import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/alerts/notifications/').then(res => {
      setNotifications(res.data.results || res.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    try {
      await api.patch(`/alerts/notifications/${id}/read/`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h1>Notifications</h1><p>Alert notifications for your assigned zone</p></div>
      </div>

      <div className="glass-card">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No notifications</h3>
            <p>You'll be notified when alerts are generated near your location</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notification-item ${!n.is_read ? 'unread' : ''}`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              {!n.is_read && <div className="notification-dot" />}
              <div className="notification-content">
                <h4>Detection Alert — {n.missing_person_name}</h4>
                <p>Matched on camera: {n.camera_name}</p>
              </div>
              <span className="notification-time">
                {new Date(n.sent_at).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
