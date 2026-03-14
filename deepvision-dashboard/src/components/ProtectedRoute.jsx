import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard if they try accessing an unauthorized route
    const dashboardMap = { CITIZEN: '/dashboard', POLICE: '/police', ADMIN: '/admin' }
    return <Navigate to={dashboardMap[user.role] || '/dashboard'} replace />
  }

  return children
}
