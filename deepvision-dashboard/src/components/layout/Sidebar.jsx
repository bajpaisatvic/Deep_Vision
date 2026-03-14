import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HiOutlineHome, HiOutlineDocumentPlus, HiOutlineFolderOpen,
  HiOutlineExclamationTriangle, HiOutlineBell, HiOutlineVideoCamera,
  HiOutlineEye, HiOutlineSignal
} from 'react-icons/hi2'

const menuConfig = {
  CITIZEN: [
    { section: 'Main', items: [
      { label: 'Dashboard', icon: HiOutlineHome, path: '/dashboard' },
      { label: 'Report Missing', icon: HiOutlineDocumentPlus, path: '/report' },
      { label: 'My Cases', icon: HiOutlineFolderOpen, path: '/my-cases' },
    ]},
  ],
  POLICE: [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: HiOutlineHome, path: '/police' },
    ]},
    { section: 'Investigation', items: [
      { label: 'Live Monitor', icon: HiOutlineSignal, path: '/police/live' },
      { label: 'All Cases', icon: HiOutlineFolderOpen, path: '/police/cases' },
      { label: 'Alerts', icon: HiOutlineExclamationTriangle, path: '/police/alerts' },
      { label: 'Notifications', icon: HiOutlineBell, path: '/police/notifications' },
    ]},
  ],
  ADMIN: [
    { section: 'Overview', items: [
      { label: 'Dashboard', icon: HiOutlineHome, path: '/admin' },
    ]},
    { section: 'Management', items: [
      { label: 'Live Monitor', icon: HiOutlineSignal, path: '/admin/live' },
      { label: 'All Cases', icon: HiOutlineFolderOpen, path: '/admin/cases' },
      { label: 'Alerts', icon: HiOutlineExclamationTriangle, path: '/admin/alerts' },
      { label: 'Cameras', icon: HiOutlineVideoCamera, path: '/admin/cameras' },
      { label: 'Notifications', icon: HiOutlineBell, path: '/admin/notifications' },
    ]},
  ],
}

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const sections = menuConfig[user?.role] || menuConfig.CITIZEN

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <HiOutlineEye />
        </div>
        <div>
          <h2>Deep Vision</h2>
          <span>AI Surveillance</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div className="sidebar-nav-section" key={section.section}>
            <div className="sidebar-nav-label">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
                end={item.path === '/dashboard' || item.path === '/police' || item.path === '/admin'}
              >
                <span className="nav-item-icon"><item.icon /></span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
