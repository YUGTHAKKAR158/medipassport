import RecordEditForm from '../components/RecordEditForm'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRecords, getQRCode, getPendingRequests, respondAccess, editRecord, getProfile } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { getGrantedAccess, revokeAccess, createShareLink, getMyShareLinks, revokeShareLink, getActivityLog, logActivity } from '../services/api'

const RECORD_TYPES = [
  'Lab Report', 'Prescription', 'Surgery Notes',
  'X-Ray / Scan', 'Vaccination', 'Diagnosis',
  'General Checkup', 'Other'
]

function AccessControlTab() {
  const [granted, setGranted] = useState([])
  const [shareLinks, setShareLinks] = useState([])

  useEffect(() => {
    fetchGranted()
    fetchShareLinks()
  }, [])

  const fetchShareLinks = async () => {
    try {
      const res = await getMyShareLinks()
      setShareLinks(res.data)
    } catch (err) { }
  }

  const handleRevokeShare = async (token) => {
    if (!window.confirm('Deactivate this share link?')) return
    try {
      await revokeShareLink(token)
      setShareLinks(prev => prev.filter(l => l.share_token !== token))
    } catch (err) { }
  }

  const fetchGranted = async () => {
    try {
      const res = await getGrantedAccess()
      setGranted(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRevoke = async (requestId) => {
    if (!window.confirm('Revoke this doctor\'s access to your records?')) return
    try {
      await revokeAccess(requestId)
      setGranted(prev => prev.filter(r => r.request_id !== requestId))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <p className="font-medium text-gray-700 mb-1">Doctors with access to your records</p>
        <p className="text-xs text-gray-400 mb-4">You can revoke access at any time</p>
        {granted.length === 0 ? (
          <p className="text-gray-400 text-sm">No doctors currently have access to your records.</p>
        ) : (
          granted.map(r => (
            <div key={r.request_id} className="flex justify-between items-center py-3 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">Dr. {r.doctor_name}</p>
                <p className="text-xs text-gray-400">{r.doctor_email}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Expires: {r.expires_at === 'Permanent' ? 'Never (Permanent)' : new Date(r.expires_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(r.request_id)}
                className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-100 transition"
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm mt-4">
        <p className="font-medium text-gray-700 mb-1">Active Share Links</p>
        <p className="text-xs text-gray-400 mb-4">Anyone with these links can view the specific record for 24 hours.</p>
        {shareLinks.length === 0 ? (
          <p className="text-gray-400 text-sm">No active share links.</p>
        ) : (
          shareLinks.map(link => (
            <div key={link.share_token} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b last:border-0 gap-3">
              <div>
                <p className="text-sm font-medium text-indigo-700">{link.record_title}</p>
                <div className="flex items-center gap-2 mt-1 relative">
                  <input readOnly value={`${window.location.protocol}//${window.location.host}/shared/${link.share_token}`} className="text-xs bg-slate-50 border px-2 py-1 rounded w-64 text-slate-500 font-mono" />
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/shared/${link.share_token}`)
                  }} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Copy</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Expires: {new Date(link.expires_at).toLocaleString()} • Views: {link.accessed_count}
                </p>
              </div>
              <button
                onClick={() => handleRevokeShare(link.share_token)}
                className="text-xs self-start sm:self-auto bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-100 transition whitespace-nowrap"
              >
                Deactivate
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [qrCode, setQrCode] = useState(null)
  const [pendingRequests, setPendingRequests] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [copySuccess, setCopySuccess] = useState(false)
  const [viewingRecord, setViewingRecord] = useState(null)
  const [shareModal, setShareModal] = useState({ show: false, token: null })

  const [profile, setProfile] = useState(null)
  const [activities, setActivities] = useState([])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [recordsRes, qrRes, requestsRes, profileRes, activityRes] = await Promise.all([
        getRecords(),
        getQRCode(user.id),
        getPendingRequests(),
        getProfile(),
        getActivityLog()
      ])
      setRecords(recordsRes.data)
      setQrCode(qrRes.data.qr_code)
      setPendingRequests(requestsRes.data)
      setProfile(profileRes.data)
      setActivities(activityRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccessResponse = async (requestId, status, expiryDays) => {
    try {
      await respondAccess(requestId, status, expiryDays)
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      await logActivity('ACCESS_RESPONSE', `Responded '${status}' to access request.`)
      fetchData()
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

  const handleShareRecord = async (recordId) => {
    try {
      const res = await createShareLink(recordId)
      setShareModal({ show: true, token: res.data.share_token })
      await logActivity('SHARE_CREATED', `Generated active share link for record #${recordId}.`)
      fetchData()
    } catch (err) {
      alert('Failed to generate share link.')
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      'Lab Report': 'bg-blue-100 text-blue-600',
      'Prescription': 'bg-green-100 text-green-600',
      'X-Ray / Scan': 'bg-purple-100 text-purple-600',
      'Surgery Notes': 'bg-red-100 text-red-600',
      'Vaccination': 'bg-yellow-100 text-yellow-600',
      'Diagnosis': 'bg-orange-100 text-orange-600',
      'General Checkup': 'bg-teal-100 text-teal-600',
    }
    return colors[type] || 'bg-gray-100 text-gray-600'
  }

  const getTypeInitial = (type) => {
    const initials = {
      'Lab Report': 'LAB',
      'Prescription': 'RX',
      'X-Ray / Scan': 'XR',
      'Surgery Notes': 'SRG',
      'Vaccination': 'VAC',
      'Diagnosis': 'DX',
      'General Checkup': 'CHK',
    }
    return initials[type] || 'REC'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Decrypting health data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white text-gray-900 font-sans">
      
      {/* --- PRINT ONLY DOCUMENT --- */}
      <div className="hidden print:block absolute top-0 left-0 w-full p-8 font-sans m-0 bg-white z-50 text-black">
        <div className="border-b-4 border-blue-800 pb-4 mb-6 text-center">
          <h1 className="text-4xl font-bold tracking-wider text-blue-900">MediPassport</h1>
          <p className="text-base text-gray-600 uppercase tracking-[0.3em] mt-2 font-bold">Official Medical Record</p>
          <p className="text-sm mt-3 font-medium text-gray-500">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6 rounded-lg p-6 bg-gray-50 border-2 border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-3">Patient Details</h2>
            <p className="mb-1 text-base"><strong>Name:</strong> {user?.name}</p>
            <p className="mb-1 text-base"><strong>Health ID:</strong> {user?.health_id}</p>
            <p className="mb-1 text-base"><strong>DOB:</strong> {profile?.date_of_birth || 'N/A'}</p>
            <p className="mb-1 text-base"><strong>Gender:</strong> {profile?.gender || 'N/A'}</p>
            <p className="text-base mt-2"><strong>Blood Type:</strong> <span className="font-extrabold text-red-600 text-lg ml-1">{profile?.blood_type || 'Unknown'}</span></p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-3">Emergency Contact</h2>
            <p className="mb-1 text-base"><strong>Name:</strong> {profile?.emergency_contact_name || 'N/A'}</p>
            <p className="mb-1 text-base"><strong>Phone:</strong> {profile?.emergency_contact_phone || 'N/A'}</p>
          </div>
        </div>

        {profile?.allergies && profile.allergies !== 'None recorded' && (
          <div className="mb-6 border-l-4 border-red-600 bg-red-50 p-4 rounded-r-lg">
            <h2 className="text-lg font-bold text-red-800 mb-1 flex items-center gap-2">CRITICAL ALLERGY ALERT</h2>
            <p className="text-red-900 font-medium text-base">{profile.allergies}</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-blue-900 border-b-2 border-gray-300 pb-2 mb-6">Complete Medical Timeline</h2>
          {records.length === 0 ? <p className="text-gray-500 italic">No records found for this patient.</p> : (
            <div className="space-y-6 break-inside-auto">
              {records.map(r => (
                <div key={r.id} className="border-l-4 border-blue-400 pl-4 py-2 break-inside-avoid shadow-sm rounded-r-lg bg-gray-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{r.title}</h3>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-800 tracking-wider uppercase border border-blue-200">{r.record_type}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-base text-gray-800 mb-2 leading-relaxed">{r.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-xs text-gray-500 pb-8 border-t-2 border-gray-200 pt-6 font-medium">
          <p>Generated by MediPassport — Confidential Medical Document</p>
          <p className="mt-1">This document is electronically generated and requires no formal signature.</p>
        </div>
      </div>
      {/* --- END PRINT ONLY DOCUMENT --- */}

      <div className="print:hidden">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-600">MediPassport</h1>
          <p className="text-xs text-gray-400">Patient Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hello, {user?.name}</span>
          <button
            onClick={() => navigate('/profile')}
            className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
          >
            My Profile
          </button>
          <button
            onClick={logout}
            className="text-sm bg-red-50 text-red-500 px-3 py-1 rounded-lg hover:bg-red-100 transition"
          >
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
              <div key={req.id} className="bg-white rounded-lg p-4 mb-2 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Dr. {req.doctor_name}</p>
                    <p className="text-xs text-gray-400">{req.doctor_email}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Grant access for:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '1 Day', value: 1 },
                      { label: '1 Week', value: 7 },
                      { label: '1 Month', value: 30 },
                      { label: 'Permanent', value: null }
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => handleAccessResponse(req.id, 'approved', opt.value)}
                        className="text-xs bg-green-50 text-green-700 border border-green-300 px-3 py-1 rounded-lg hover:bg-green-100 transition"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleAccessResponse(req.id, 'denied', null)}
                  className="text-xs bg-red-50 text-red-500 border border-red-200 px-4 py-1 rounded-lg hover:bg-red-100 transition"
                >
                  Deny Access
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['overview', 'records', 'qrcode', 'access', 'activity'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                'px-4 py-2 rounded-lg text-sm font-medium transition capitalize ' +
                (activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100')
              }
            >
              {tab === 'qrcode' ? 'My QR Code' : tab === 'access' ? 'Access Control' : tab === 'activity' ? 'Activity Log' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-700 font-semibold">Your Medical Timeline</p>
              <button 
                onClick={() => window.print()} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm hover:shadow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download PDF
              </button>
            </div>
            {records.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <p className="text-gray-400">No medical records found.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-100"></div>
                {records.map((r, index) => (
                  <div key={r.id} className="relative flex gap-4 mb-4">
                    <div className={'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold ' + getTypeColor(r.record_type)}>
                      {getTypeInitial(r.record_type)}
                    </div>
                    <div className="flex-1 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                      {editingRecord === r.id ? (
                        <RecordEditForm
                          record={r}
                          onSave={async (id, formData) => {
                            try {
                              const res = await editRecord(id, formData)
                              setRecords(prev => prev.map(rec =>
                                rec.id === id ? { ...rec, title: formData.get('title'), record_type: formData.get('record_type'), description: formData.get('description'), file_urls: res.data.file_urls } : rec
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
                              <p className="font-medium text-gray-800">{r.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              <p className="text-sm text-gray-500 mt-2">{r.description}</p>
                              {r.file_urls && r.file_urls.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {r.file_urls.map((url, i) => (
                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs bg-teal-50 text-teal-600 border border-teal-200 px-3 py-1 rounded-lg hover:bg-teal-100">
                                      View File {i + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-3">
                              <button onClick={() => setEditingRecord(r.id)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
                                Edit
                              </button>
                              <button onClick={() => handleShareRecord(r.id)} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-100 shadow-sm transition">
                                Share
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

        {activeTab === 'access' && (
          <AccessControlTab />
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-700 font-semibold mb-4 border-b pb-2">Recent Account Activity</h2>
            {activities.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {activities.map(log => (
                  <div key={log.id} className="flex gap-4 items-start">
                    <div className="bg-blue-50 p-2 rounded-full text-blue-500 mt-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">{log.description}</p>
                      <div className="flex gap-3 text-xs text-gray-400 mt-1">
                        <span>{log.timestamp}</span>
                        <span>IP: {log.ip_address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {shareModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShareModal({ show: false, token: null })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <h3 className="text-lg font-bold text-center text-gray-800 mb-1">Link Generated</h3>
            <p className="text-xs text-center text-gray-500 mb-4">This temporary link expires in 24 hours.</p>
            <div className="flex gap-2">
              <input type="text" readOnly value={`${window.location.protocol}//${window.location.host}/shared/${shareModal.token}`} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none" />
              <button 
                onClick={() => navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/shared/${shareModal.token}`)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}