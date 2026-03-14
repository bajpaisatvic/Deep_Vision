import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const login = async (username, password) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login/', { username, password })
      const { user: userData, tokens } = res.data
      localStorage.setItem('tokens', JSON.stringify(tokens))
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)

      // Redirect based on role
      const dashboardMap = { CITIZEN: '/dashboard', POLICE: '/police', ADMIN: '/admin' }
      navigate(dashboardMap[userData.role] || '/dashboard')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Check your credentials.'
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (formData) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/register/', formData)
      const { user: userData, tokens } = res.data
      localStorage.setItem('tokens', JSON.stringify(tokens))
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      navigate('/dashboard')
      return { success: true }
    } catch (error) {
      const errors = error.response?.data
      let message = 'Registration failed.'
      if (errors && typeof errors === 'object') {
        message = Object.values(errors).flat().join(' ')
      }
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('tokens')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const value = { user, loading, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
