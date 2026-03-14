import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HiOutlineBell, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || user.username?.[0] || ''}`.toUpperCase()
    : '?'

  const notifPath = user?.role === 'CITIZEN' ? '/dashboard'
    : user?.role === 'POLICE' ? '/police/notifications'
    : '/admin/notifications'

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2>Welcome back, {user?.first_name || user?.username} 👋</h2>
      </div>
      <div className="navbar-right">
        <button className="navbar-icon-btn" onClick={() => navigate(notifPath)} title="Notifications">
          <HiOutlineBell />
          <span className="notif-dot" />
        </button>

        <div className="navbar-user">
          <div className="navbar-user-avatar">{initials}</div>
          <div className="navbar-user-info">
            <div className="name">{user?.first_name || user?.username}</div>
            <div className="role">{user?.role}</div>
          </div>
        </div>

        <button className="navbar-icon-btn" onClick={logout} title="Logout">
          <HiOutlineArrowRightOnRectangle />
        </button>
      </div>
    </header>
  )
}
