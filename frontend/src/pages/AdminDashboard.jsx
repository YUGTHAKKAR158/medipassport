import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDoctors()
    } else if (user) {
      navigate('/')
    }
  }, [user])

  const fetchDoctors = async () => {
    try {
      const res = await API.get('/admin/doctors')
      setDoctors(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (doctorId, status) => {
    try {
      await API.post(`/admin/doctors/${doctorId}/verify`, { is_verified: status })
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, is_verified: status } : d))
    } catch (err) {
      alert('Action failed')
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex justify-center items-center">Loading Admin Portal...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-slate-900 text-white shadow-xl px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">MediPassport Admin</h1>
          <p className="text-xs text-slate-400">System Management</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">Admin {user?.name}</span>
          <button onClick={logout} className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition font-medium">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-2 border-b pb-4">Doctor Verification Requests</h2>
          <p className="text-sm text-slate-500 mb-6">Review and approve accounts registered as doctors to grant them platform access.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-y">
                  <th className="py-3 px-4 font-medium uppercase tracking-wider">Doctor Details</th>
                  <th className="py-3 px-4 font-medium uppercase tracking-wider">Registered On</th>
                  <th className="py-3 px-4 font-medium uppercase tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 font-medium uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 italic">No doctors found in the system.</td>
                  </tr>
                ) : (
                  doctors.map(doc => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">Dr. {doc.name}</p>
                        <p className="text-sm text-slate-500">{doc.email}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {doc.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {doc.is_verified ? (
                          <button onClick={() => handleVerify(doc.id, false)} className="text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg transition font-medium">Revoke Access</button>
                        ) : (
                          <button onClick={() => handleVerify(doc.id, true)} className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm px-4 py-1.5 rounded-lg transition font-medium">Approve</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
