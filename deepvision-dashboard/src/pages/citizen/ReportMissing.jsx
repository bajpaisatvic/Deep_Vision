import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { HiOutlineCloudArrowUp } from 'react-icons/hi2'

export default function ReportMissing() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', age: '', gender: 'MALE', description: '',
    last_seen_location: '', last_seen_time: '',
  })
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create the case
      const payload = { ...form, age: parseInt(form.age) }
      if (!payload.last_seen_time) delete payload.last_seen_time
      const res = await api.post('/cases/', payload)
      const caseId = res.data.id

      // Upload image if provided
      if (image) {
        const formData = new FormData()
        formData.append('image', image)
        formData.append('is_primary', 'true')
        await api.post(`/cases/${caseId}/images/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate(`/cases/${caseId}`)
    } catch (err) {
      const msg = err.response?.data
      setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Failed to create case.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Report Missing Person</h1>
          <p>Provide details and a photo for facial recognition</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem', maxWidth: '700px' }}>
        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input name="name" className="form-input" placeholder="Full name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input name="age" type="number" className="form-input" placeholder="Age" value={form.age} onChange={handleChange} required min="0" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Gender *</label>
            <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-textarea" placeholder="Physical description, clothing, distinguishing features..." value={form.description} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Last Seen Location</label>
              <input name="last_seen_location" className="form-input" placeholder="Location" value={form.last_seen_location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Seen Time</label>
              <input name="last_seen_time" type="datetime-local" className="form-input" value={form.last_seen_time} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Photo (for facial recognition)</label>
            <div className="image-upload-zone" onClick={() => document.getElementById('photo-input').click()}>
              <input id="photo-input" type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
              <div className="upload-icon"><HiOutlineCloudArrowUp /></div>
              <p>{image ? image.name : 'Click to upload a clear face photo'}</p>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  )
}
