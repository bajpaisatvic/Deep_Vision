import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import AlertToast from './components/AlertToast'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Citizen pages
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import ReportMissing from './pages/citizen/ReportMissing'
import MyCases from './pages/citizen/MyCases'

// Shared pages
import CaseDetail from './pages/shared/CaseDetail'

// Police pages
import PoliceDashboard from './pages/police/PoliceDashboard'
import AllCases from './pages/police/AllCases'
import AlertsList from './pages/police/AlertsList'
import AlertDetail from './pages/police/AlertDetail'
import Notifications from './pages/police/Notifications'
import LiveMonitoring from './pages/police/LiveMonitoring'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import CameraManagement from './pages/admin/CameraManagement'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  const map = { CITIZEN: '/dashboard', POLICE: '/police', ADMIN: '/admin' }
  return <Navigate to={map[user.role] || '/dashboard'} />
}

export default function App() {
  return (
    <>
    <AlertToast />
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected dashboard routes */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        {/* Citizen routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['CITIZEN']}>
            <CitizenDashboard />
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute allowedRoles={['CITIZEN', 'POLICE', 'ADMIN']}>
            <ReportMissing />
          </ProtectedRoute>
        } />
        <Route path="/my-cases" element={
          <ProtectedRoute allowedRoles={['CITIZEN']}>
            <MyCases />
          </ProtectedRoute>
        } />
        <Route path="/cases/:id" element={<CaseDetail />} />

        {/* Police routes */}
        <Route path="/police" element={
          <ProtectedRoute allowedRoles={['POLICE']}>
            <PoliceDashboard />
          </ProtectedRoute>
        } />
        <Route path="/police/cases" element={
          <ProtectedRoute allowedRoles={['POLICE', 'ADMIN']}>
            <AllCases />
          </ProtectedRoute>
        } />
        <Route path="/police/alerts" element={
          <ProtectedRoute allowedRoles={['POLICE', 'ADMIN']}>
            <AlertsList />
          </ProtectedRoute>
        } />
        <Route path="/police/alerts/:id" element={
          <ProtectedRoute allowedRoles={['POLICE', 'ADMIN']}>
            <AlertDetail />
          </ProtectedRoute>
        } />
        <Route path="/police/notifications" element={
          <ProtectedRoute allowedRoles={['POLICE', 'ADMIN']}>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/police/live" element={
          <ProtectedRoute allowedRoles={['POLICE', 'ADMIN']}>
            <LiveMonitoring />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/cases" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AllCases />
          </ProtectedRoute>
        } />
        <Route path="/admin/alerts" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AlertsList />
          </ProtectedRoute>
        } />
        <Route path="/admin/alerts/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AlertDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/cameras" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <CameraManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/admin/live" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <LiveMonitoring />
          </ProtectedRoute>
        } />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  )
}
