import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/PatientDashboard'
import DoctorPortal from './pages/DoctorPortal'


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
        <Route path="/" element={<Landing />} />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App