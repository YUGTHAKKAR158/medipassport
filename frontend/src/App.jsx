import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/PatientDashboard'
import DoctorPortal from './pages/DoctorPortal'
import PatientProfile from './pages/PatientProfile'
import EmergencyView from './pages/EmergencyView'

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (role && user.role !== role) return <Navigate to="/login" />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute role="patient">
            <PatientDashboard />
          </ProtectedRoute>
        } />
        <Route path="/doctor" element={
          <ProtectedRoute role="doctor">
            <DoctorPortal />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute role="patient">
            <PatientProfile />
          </ProtectedRoute>
        } />
        <Route path="/emergency/:healthId" element={<EmergencyView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App