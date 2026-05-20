import { useState, useEffect } from 'react'
import { HiOutlineXMark, HiOutlineExclamationTriangle } from 'react-icons/hi2'

/**
 * AlertToast — Floating notification for real-time alerts via Socket.IO
 */
export default function AlertToast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    let socket
    import('socket.io-client').then(({ io }) => {
      // VITE_REALTIME_URL is empty in Docker builds (Nginx proxies /socket.io)
      // and http://localhost:4000 in local dev (set in .env.development)
      const realtimeUrl = import.meta.env.VITE_REALTIME_URL || undefined
      socket = io(realtimeUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      })

      socket.on('connect', () => {
        console.log('🟢 Connected to real-time server')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role === 'POLICE') socket.emit('join_officer_room', user.id)
        else if (user.role === 'ADMIN') socket.emit('join_admin_room')
      })

      socket.on('new_alert', (alert) => {
        const toast = { id: Date.now() + Math.random(), ...alert }
        setToasts(prev => [toast, ...prev].slice(0, 5))
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id))
        }, 10000)

        // Notification beep
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.frequency.value = 880; gain.gain.value = 0.12
          osc.start(); osc.stop(ctx.currentTime + 0.15)
          setTimeout(() => {
            const o2 = ctx.createOscillator(), g2 = ctx.createGain()
            o2.connect(g2); g2.connect(ctx.destination)
            o2.frequency.value = 1100; g2.gain.value = 0.12
            o2.start(); o2.stop(ctx.currentTime + 0.2)
          }, 180)
        } catch (e) {}
      })

      socket.on('disconnect', () => console.log('🔴 Disconnected from real-time server'))
    }).catch(() => console.warn('Socket.IO client not available'))

    return () => { if (socket) socket.disconnect() }
  }, [])

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 72, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '0.6rem',
      maxWidth: '360px', width: '100%',
    }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{
          background: '#fff', border: '1px solid #fecaca',
          borderLeft: '4px solid #dc2626', borderRadius: '10px',
          padding: '0.85rem 1rem', animation: 'slideInRight 0.3s ease',
          boxShadow: '0 8px 30px rgba(220,38,38,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#dc2626', fontSize: '1rem', flexShrink: 0,
              }}>
                <HiOutlineExclamationTriangle />
              </div>
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', marginBottom: '0.15rem' }}>
                  🚨 Match Detected
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0.1rem 0' }}>
                  <strong>{toast.missing_person_name}</strong>
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  📹 {toast.camera_name} • {((toast.confidence_score || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <button onClick={() => dismiss(toast.id)} style={{
              background: 'none', border: 'none', color: '#9ca3af',
              cursor: 'pointer', padding: '0.2rem',
            }}>
              <HiOutlineXMark />
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(80px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
