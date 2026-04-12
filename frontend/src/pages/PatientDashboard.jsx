import RecordEditForm from '../components/RecordEditForm'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRecords, getQRCode, getPendingRequests, respondAccess, editRecord, getProfile, updateProfile } from '../services/api'

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
  const [profileForm, setProfileForm] = useState({
    blood_group: 'A+',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  })
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [profileStatus, setProfileStatus] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (activeTab === 'profile' && !profileLoaded) {
      getProfile().then(res => {
        let initialCode = '+91'
        let initialNumber = ''
        const ePhone = res.data.emergency_contact_phone || ''
        if (ePhone.includes(' ')) {
           const parts = ePhone.split(' ')
           initialCode = parts[0]
           initialNumber = parts.slice(1).join(' ')
        } else {
           initialNumber = ePhone
        }
        setCountryCode(initialCode)
        setPhone(initialNumber)
        setProfileForm({
          blood_group: res.data.blood_group || 'A+',
          allergies: res.data.allergies || '',
          emergency_contact_name: res.data.emergency_contact_name || '',
          emergency_contact_phone: ePhone
        })
        setProfileLoaded(true)
      }).catch(err => {
        console.error(err)
        setProfileError('Failed to load profile')
      })
    }
  }, [activeTab, profileLoaded])

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault()
    if (phone && phone.length !== 10) {
      setProfileError('Phone number must be exactly 10 digits')
      return
    }
    try {
      setProfileError('')
      setProfileStatus(null)
      const payload = {
        ...profileForm,
        emergency_contact_phone: phone ? `${countryCode} ${phone}` : ''
      }
      await updateProfile(payload)
      setProfileStatus('success')
      setTimeout(() => setProfileStatus(null), 3000)
    } catch (err) {
      setProfileError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update profile. Please try again.')
    }
  }

  const isPhoneInvalid = phone.length > 0 && phone.length !== 10;

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
    const id = user?.health_id
    if (!id) return
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(id).then(() => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      }).catch(() => {
        fallbackCopy(id)
      })
    } else {
      fallbackCopy(id)
    }
  }

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      document.execCommand('copy')
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
    document.body.removeChild(textarea)
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-slate-500 font-medium">Loading your health data...</p>
        </div>
      </div>
    )
  }

  const getRecordColor = (type) => {
    switch (type) {
      case 'Lab Report': return '#3B82F6';
      case 'Prescription': return '#10B981';
      case 'Surgery Notes': return '#EF4444';
      case 'X-Ray / Scan': return '#8B5CF6';
      case 'Vaccination': return '#06B6D4';
      default: return '#94A3B8';
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR: Two-column layout on desktop, dark navy #0F172A background, full height */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] shrink-0 sticky top-0 h-screen shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="text-blue-500">
            {/* Heartbeat SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">MediPassport</h1>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
            { id: 'profile', label: 'Profile', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
            { id: 'records', label: 'Records', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
            { id: 'qrcode', label: 'My QR Code', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg> }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === item.id 
                ? 'bg-blue-900/40 text-blue-400 border-l-4 border-blue-500' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold tracking-widest text-sm shadow-inner uppercase">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-200">{user?.name}</span>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full w-fit mt-1">Patient</span>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-300 hover:text-red-400 font-semibold rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-h-screen overflow-y-auto">
        {/* Mobile Header wrapper for small screens */}
        <div className="md:hidden bg-[#0F172A] text-white p-4 flex justify-between items-center sticky top-0 z-50">
           <div className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
             <h1 className="font-extrabold tracking-tight">MediPassport</h1>
           </div>
           <button onClick={logout} className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-md text-red-300">Logout</button>
        </div>

        {/* Mobile Navigation fallback */}
        <div className="md:hidden flex overflow-x-auto bg-[#0F172A]/95 backdrop-blur-md sticky top-[60px] z-40 border-t border-slate-800">
           {['overview', 'profile', 'records', 'qrcode'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap capitalize border-b-2 transition ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'}`}
             >
               {tab === 'qrcode' ? 'My QR Code' : tab}
             </button>
           ))}
        </div>

        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out_forwards]">
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          
          {/* Health ID Card - Top of main content (Always visible or in Overview? Instruction says top of main content, so I'll render it universally or inside overview) */}
          {(activeTab === 'overview' || activeTab === 'records' || activeTab === 'profile') && (
            <div className="bg-gradient-to-r from-[#0F172A] to-blue-900 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl border border-blue-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              {/* Right side squares pattern */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <pattern id="squares" width="20" height="20" patternUnits="userSpaceOnUse">
                    <rect width="18" height="18" fill="currentColor" className="text-blue-200" rx="4"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#squares)" />
                </svg>
              </div>

              <div className="relative z-10 space-y-4 w-full">
                <div className="flex justify-between items-start w-full">
                   <p className="text-blue-300 text-sm font-bold tracking-widest uppercase mb-1">Your Health ID</p>
                   {/* Patient Badge */}
                   <span className="bg-blue-500 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                     Patient
                   </span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 border border-white/20 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4">
                      <p className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-wider outline-none truncate max-w-[200px] sm:max-w-xs">
                        {user?.health_id}
                      </p>
                      <button
                        onClick={handleCopyId}
                        className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition flex items-center justify-center group shadow-sm"
                        title="Copy Health ID"
                      >
                        {copySuccess ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-blue-300/80 break-all select-all pl-2">
                    {user?.health_id}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW TAB CONTENT */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-blue-500 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-4xl font-extrabold text-slate-800">{records.length}</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">Total Records</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-amber-500 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-4xl font-extrabold text-slate-800">{pendingRequests.length}</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">Pending Requests</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-green-500 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-green-600 mt-1">Active</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">Account Status</p>
                  </div>
                </div>
              </div>

              {/* Pending Requests Banner */}
              {pendingRequests.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <p className="text-amber-800 font-extrabold text-lg">
                      Action Required: {pendingRequests.length} Access Request(s)
                    </p>
                  </div>
                  <div className="space-y-3">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-amber-100/50 gap-4 transition hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-lg">
                            {req.doctor_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-lg">Dr. {req.doctor_name}</p>
                            <p className="text-sm font-medium text-slate-500">{req.doctor_email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAccessResponse(req.id, 'denied')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition shadow-sm" title="Deny">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          <button onClick={() => handleAccessResponse(req.id, 'approved')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-100 transition shadow-sm" title="Approve">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Patient Profile</h2>
              <p className="text-slate-500 font-medium mb-6">Manage your medical profile and emergency contacts.</p>
              
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-blue-800 text-sm font-semibold">
                  This information is shown to doctors in emergencies even without your consent
                </p>
              </div>

              {profileStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 bg-green-50 text-green-700 border border-green-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Profile updated successfully!
                </div>
              )}
              {profileError && (
                <div className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Blood Group</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    value={profileForm.blood_group}
                    onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Allergies</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium min-h-[100px]"
                    placeholder="e.g. Penicillin, Pollen, Peanuts"
                    value={profileForm.allergies}
                    onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Emergency Contact Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      value={profileForm.emergency_contact_name}
                      onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Emergency Contact Phone</label>
                    <div className="flex gap-2">
                      <select 
                        className="w-1/3 sm:w-32 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+65">🇸🇬 +65</option>
                      </select>
                      <input
                        type="text"
                        maxLength={10}
                        className={`w-full bg-slate-50 border text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${isPhoneInvalid ? 'border-red-500' : 'border-slate-200'}`}
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPhone(val);
                        }}
                      />
                    </div>
                    {isPhoneInvalid && <p className="text-red-500 text-xs font-bold mt-1">Phone number must be exactly 10 digits</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPhoneInvalid}
                  className={`px-6 py-3 text-white font-bold rounded-xl transition shadow-md flex items-center gap-2 ${isPhoneInvalid ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {/* RECORDS TAB */}
          {activeTab === 'records' && (
            <div className="space-y-5">
              {records.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold text-lg">No medical records found.</p>
                  <p className="text-slate-400 text-sm mt-2">Your history will appear here once added by a doctor.</p>
                </div>
              ) : (
                records.map(r => (
                  <div 
                    key={r.id} 
                    className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 flex flex-col relative overflow-hidden transition-all hover:shadow-md"
                    style={{ borderLeftWidth: '6px', borderLeftColor: getRecordColor(r.record_type) }}
                  >
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
                      <>
                        {/* Edit Button top right */}
                        <button
                          onClick={() => setEditingRecord(r.id)}
                          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Record"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        
                        <div className="pr-12">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-xl font-extrabold text-slate-800">{r.title}</h3>
                            <span 
                              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-sm"
                              style={{ backgroundColor: getRecordColor(r.record_type) }}
                            >
                              {r.record_type}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>

                          <p className="text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            {r.description}
                          </p>

                          {r.file_urls && r.file_urls.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-6">
                              {r.file_urls.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-sm font-bold bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm group"
                                >
                                  {/* Paperclip matching instruction */}
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                  File Attachment {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* QR CODE TAB */}
          {activeTab === 'qrcode' && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="bg-[#0F172A] rounded-3xl shadow-2xl p-8 sm:p-14 text-center max-w-lg w-full border border-slate-800">
                <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Access QR</h2>
                <p className="text-blue-300 text-sm mb-10 font-medium">Valid for emergency access</p>
                
                {qrCode ? (
                  <div className="flex flex-col items-center">
                    <div className="relative p-6 bg-white rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.3)] mb-6">
                       {/* Decorative Corner Brackets */}
                       <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl pointer-events-none"></div>
                       <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl pointer-events-none"></div>
                       <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl pointer-events-none"></div>
                       <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl pointer-events-none"></div>
                       
                       <img
                         src={'data:image/png;base64,' + qrCode}
                         alt="Your QR Code"
                         className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                       />
                    </div>
                    
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = 'data:image/png;base64,' + qrCode
                        link.download = `medipassport-qr-${user?.health_id?.slice(0,8)}.png`
                        link.click()
                      }}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-blue-500 text-blue-500 font-bold rounded-xl hover:bg-blue-50 transition shadow-sm justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download QR Code
                    </button>
                    <p className="text-slate-400 text-sm mt-3 font-medium text-center">Show this QR to any doctor or first responder for instant access</p>

                    <div className="flex flex-col w-full gap-4 mt-8">
                      <div className="bg-slate-800/50 border border-slate-700 px-6 py-4 rounded-xl text-white font-mono font-bold tracking-widest text-sm w-full shadow-inner truncate">
                        {user?.health_id}
                      </div>
                      <button
                        onClick={handleCopyId}
                        className="w-full flex justify-center items-center gap-2 text-sm bg-blue-600 text-white font-bold px-6 py-4 rounded-xl hover:bg-blue-500 transition shadow-lg"
                      >
                        {copySuccess ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            COPIED
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            COPY HEALTH ID
                          </>
                        )}
                      </button>
                      <div className="text-xs font-mono text-slate-400 break-all select-all text-center">
                        {user?.health_id}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-16">
                     <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     <p className="text-blue-300 font-medium">Loading secure QR code...</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}