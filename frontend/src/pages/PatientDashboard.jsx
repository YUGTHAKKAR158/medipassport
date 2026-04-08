import RecordEditForm from '../components/RecordEditForm'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRecords, getQRCode, getPendingRequests, respondAccess, editRecord } from '../services/api'

const RECORD_TYPES = [
  'Lab Report', 'Prescription', 'Surgery Notes',
  'X-Ray / Scan', 'Vaccination', 'Diagnosis',
  'General Checkup', 'Other'
]

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const [records, setRecords] = useState([])
  const [qrCode, setQrCode] = useState(null)
  const [pendingRequests, setPendingRequests] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [copySuccess, setCopySuccess] = useState(false)
  const [viewingRecord, setViewingRecord] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [recordsRes, qrRes, requestsRes] = await Promise.all([
        getRecords(),
        getQRCode(user.id),
        getPendingRequests()
      ])
      setRecords(recordsRes.data)
      setQrCode(qrRes.data.qr_code)
      setPendingRequests(requestsRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccessResponse = async (requestId, status) => {
    try {
      await respondAccess(requestId, status)
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.health_id)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const openEdit = (record) => {
    setEditingRecord(record.id)
    setEditForm({
      title: record.title,
      record_type: record.record_type,
      description: record.description
    })
  }

  const handleSaveEdit = async (recordId) => {
    try {
      await editRecord(recordId, editForm)
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...editForm } : r))
      setEditingRecord(null)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading your health data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-600">MediPassport</h1>
          <p className="text-xs text-gray-400">Patient Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hello, {user?.name}</span>
          <button onClick={logout} className="text-sm bg-red-50 text-red-500 px-3 py-1 rounded-lg hover:bg-red-100 transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Health ID Card */}
        <div className="bg-blue-600 text-white rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-sm mb-1">Your Health ID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-bold">{user?.health_id}</p>
                <button
                  onClick={handleCopyId}
                  title="Copy Health ID"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 transition px-2 py-1 rounded text-xs font-medium"
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-blue-200 text-xs mt-2">Share this ID or your QR code with any doctor</p>
            </div>
            <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">PATIENT</span>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 font-semibold text-sm mb-3">
              {pendingRequests.length} doctor(s) requesting access to your records
            </p>
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-800">Dr. {req.doctor_name}</p>
                  <p className="text-xs text-gray-400">{req.doctor_email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccessResponse(req.id, 'approved')} className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition">Approve</button>
                  <button onClick={() => handleAccessResponse(req.id, 'denied')} className="text-xs bg-red-400 text-white px-3 py-1 rounded-lg hover:bg-red-500 transition">Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'records', 'qrcode'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                'px-4 py-2 rounded-lg text-sm font-medium transition capitalize ' +
                (activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100')
              }
            >
              {tab === 'qrcode' ? 'My QR Code' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-gray-400 text-sm">Total Records</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{records.length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-gray-400 text-sm">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-500 mt-1">{pendingRequests.length}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-gray-400 text-sm">Account Status</p>
              <p className="text-3xl font-bold text-green-500 mt-1">Active</p>
            </div>
            <div className="md:col-span-3 bg-white rounded-xl p-5 shadow-sm">
              <p className="text-gray-700 font-medium mb-3">Recent Records</p>
              {records.length === 0 ? (
                <p className="text-gray-400 text-sm">No medical records yet.</p>
              ) : (
                records.slice(0, 3).map(r => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.record_type}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <p className="text-gray-400">No medical records found.</p>
              </div>
            ) : (
              records.map(r => (
                <div key={r.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  {editingRecord === r.id ? (
                    <RecordEditForm
                      record={r}
                      onSave={async (id, formData) => {
                        try {
                          const res = await editRecord(id, formData)
                          setRecords(prev => prev.map(rec =>
                            rec.id === id
                              ? { ...rec, title: formData.get('title'), record_type: formData.get('record_type'), description: formData.get('description'), file_urls: res.data.file_urls }
                              : rec
                          ))
                          setEditingRecord(null)
                          fetchData()
                        } catch (err) { console.error(err) }
                      }}
                      onCancel={() => setEditingRecord(null)}
                    />
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-800">{r.title}</p>
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{r.record_type}</span>
                          </div>
                          <p className="text-sm text-gray-500">{r.description}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(r.date).toLocaleDateString()}</p>
                          {r.file_urls && r.file_urls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {r.file_urls.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs bg-teal-50 text-teal-600 border border-teal-200 px-3 py-1 rounded-lg hover:bg-teal-100 transition"
                                >
                                  View File {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingRecord(r.id)}
                          className="ml-4 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* QR Code Tab */}
        {activeTab === 'qrcode' && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-700 font-medium mb-2">Your Personal QR Code</p>
            <p className="text-gray-400 text-sm mb-6">Show this to any doctor to share your medical history instantly</p>
            {qrCode ? (
              <div className="flex flex-col items-center">
                <img
                  src={'data:image/png;base64,' + qrCode}
                  alt="Your QR Code"
                  className="w-56 h-56 border-4 border-blue-100 rounded-xl"
                />
                <div className="flex items-center gap-2 mt-4">
                  <p className="text-xs text-gray-400 font-mono">{user?.health_id}</p>
                  <button
                    onClick={handleCopyId}
                    className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition"
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Loading QR code...</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}