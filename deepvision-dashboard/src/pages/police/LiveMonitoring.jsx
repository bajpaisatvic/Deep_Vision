import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { HiOutlineVideoCamera, HiOutlinePlay, HiOutlineStop } from 'react-icons/hi2'

export default function LiveMonitoring() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFeeds, setActiveFeeds] = useState({})
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)
  const imgRefs = useRef({})

  useEffect(() => {
    api.get('/cameras/').then(res => {
      setCameras(res.data.results || res.data || [])
    }).catch(console.error).finally(() => setLoading(false))

    // Cleanup all feeds on unmount
    return () => {
      Object.keys(imgRefs.current).forEach(id => stopFeed(id))
    }
  }, [])

  const stopFeed = async (id) => {
    // Clear the img src first to abort the HTTP stream
    const img = imgRefs.current[id]
    if (img) img.src = ''

    // Tell Django to release the camera device
    try {
      await api.post(`/cameras/${id}/stop/`)
    } catch (e) {
      // Ignore errors — camera may already be stopped
    }
  }

  const toggleFeed = async (id) => {
    if (activeFeeds[id]) {
      // Stop the feed
      await stopFeed(id)
      setActiveFeeds(prev => ({ ...prev, [id]: false }))
    } else {
      // Start the feed
      setActiveFeeds(prev => ({ ...prev, [id]: true }))
    }
  }

  const handleSimulate = async () => {
    setSimulating(true)
    setSimResult(null)
    try {
      const res = await api.post('/cameras/simulate/')
      setSimResult(res.data)
    } catch (err) {
      setSimResult({ status: 'error', message: err.response?.data?.error || 'Simulation failed.' })
    } finally {
      setSimulating(false)
    }
  }

  const handleSimulateWithImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSimulating(true)
    setSimResult(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('/cameras/simulate/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSimResult(res.data)
    } catch (err) {
      setSimResult({ status: 'error', message: err.response?.data?.error || 'Simulation failed.' })
    } finally {
      setSimulating(false)
    }
  }

  const STREAM_BASE = '/api/cameras'

  const renderFeedCard = (id, name, location, zone) => {
    const isActive = activeFeeds[id]
    return (
      <div key={id} className="camera-feed-card">
        <div className="feed-header">
          <h4>
            {isActive && <span className="live-dot" />}
            {name}
          </h4>
          <button className={`btn ${isActive ? 'btn-danger' : 'btn-success'} btn-sm`} onClick={() => toggleFeed(id)}>
            {isActive ? <><HiOutlineStop /> Stop</> : <><HiOutlinePlay /> Start</>}
          </button>
        </div>
        <div className="feed-body">
          {isActive ? (
            <img
              ref={el => { imgRefs.current[id] = el }}
              src={`${STREAM_BASE}/${id}/stream/?t=${Date.now()}`}
              alt={name}
            />
          ) : (
            <div className="offline-label">
              <HiOutlineVideoCamera style={{ fontSize: '2rem', display: 'block', margin: '0 auto 0.3rem' }} />
              Feed offline
            </div>
          )}
        </div>
        <div className="feed-footer">
          <span>📍 {location || 'No location'}</span>
          <span>{zone || '—'}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Live Monitoring</h1>
          <p>Real-time CCTV feeds & face detection</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
            📷 Test Image
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSimulateWithImage} disabled={simulating} />
          </label>
          <button className="btn btn-primary" onClick={handleSimulate} disabled={simulating}>
            {simulating ? '⏳ Detecting...' : '🎯 Webcam Detection'}
          </button>
        </div>
      </div>

      {/* Simulation Result Banner */}
      {simResult && (
        <div className="glass-card" style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          borderColor: simResult.matches > 0 ? '#fecaca' : 'var(--border-color)',
          background: simResult.matches > 0 ? '#fef2f2' : '#fff',
        }}>
          <h4 style={{ marginBottom: '0.4rem', color: simResult.matches > 0 ? '#dc2626' : '#059669' }}>
            {simResult.matches > 0 ? '🚨 Match Found!' : simResult.status === 'error' ? '❌ Error' : '✅ No Match'}
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {simResult.message || `Faces: ${simResult.faces_found || 0} | Matches: ${simResult.matches || 0}`}
          </p>
          {simResult.alerts?.map((a, i) => (
            <div key={i} style={{
              padding: '0.6rem 0.85rem', marginTop: '0.5rem',
              background: '#fff', borderRadius: 'var(--radius-sm)',
              border: '1px solid #fecaca',
            }}>
              <strong>{a.missing_person_name}</strong> — {(a.confidence * 100).toFixed(1)}% confidence
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Alert #{a.alert_id}</span>
            </div>
          ))}
        </div>
      )}

      {/* Camera Feeds Grid */}
      <div className="camera-feed-grid">
        {renderFeedCard(0, 'Local Webcam', 'This Device', 'Test')}
        {cameras.map(cam => renderFeedCard(cam.id, cam.name, cam.location_name, cam.zone))}
      </div>

      {loading && <div className="spinner-container"><div className="spinner" /></div>}

      {!loading && cameras.length === 0 && (
        <div className="glass-card empty-state" style={{ padding: '2rem' }}>
          <div className="empty-state-icon"><HiOutlineVideoCamera /></div>
          <h3>No cameras registered</h3>
          <p>Add cameras from admin dashboard to see additional feeds here</p>
        </div>
      )}
    </div>
  )
}
