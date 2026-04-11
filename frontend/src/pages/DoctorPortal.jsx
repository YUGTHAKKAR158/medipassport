import RecordEditForm from '../components/RecordEditForm'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { requestAccess, addRecord, getApprovedPatients, getPatientRecords, editRecord, deleteRecord } from '../services/api'

const RECORD_TYPES = [
  'Lab Report', 'Prescription', 'Surgery Notes',
  'X-Ray / Scan', 'Vaccination', 'Diagnosis',
  'General Checkup', 'Other'
]

function emptyRecord() {
  return { id: Date.now(), title: '', record_type: 'Lab Report', description: '', files: [], customType: '', status: null }
}

export default function DoctorPortal() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('scan')
  const [healthId, setHealthId] = useState('')
  const [accessStatus, setAccessStatus] = useState(null)
  const [accessMessage, setAccessMessage] = useState('')
  const [approvedPatients, setApprovedPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientRecords, setPatientRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [recordCards, setRecordCards] = useState([emptyRecord()])
  const [editingRecord, setEditingRecord] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => { if (user) fetchApprovedPatients() }, [user])

  const fetchApprovedPatients = async () => {
    try {
      const res = await getApprovedPatients(user.id)
      setApprovedPatients(res.data)
    } catch (err) { console.error(err) }
  }

  const handleRequestAccess = async () => {
    if (!healthId.trim()) return
    try {
      await requestAccess(healthId)
      setAccessStatus('success')
      setAccessMessage('Access request sent! Waiting for patient to approve.')
    } catch (err) {
      setAccessStatus('error')
      setAccessMessage(err.response?.data?.error || 'Patient not found. Check the Health ID.')
    }
  }

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient)
    setLoadingRecords(true)
    setEditingRecord(null)
    try {
      const res = await getPatientRecords(patient.patient_id)
      setPatientRecords(res.data)
    } catch { setPatientRecords([]) }
    finally { setLoadingRecords(false) }
  }

  const openEdit = (record) => {
    setEditingRecord(record.id)
    setEditForm({ title: record.title, record_type: record.record_type, description: record.description })
  }

  const handleSaveEdit = async (recordId) => {
    try {
      await editRecord(recordId, editForm)
      setPatientRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...editForm } : r))
      setEditingRecord(null)
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return
    try {
      await deleteRecord(recordId)
      setPatientRecords(prev => prev.filter(r => r.id !== recordId))
    } catch (err) { console.error(err) }
  }

  const updateCard = (id, field, value) => {
    setRecordCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const addFileToCard = (id, newFiles) => {
    setRecordCards(prev => prev.map(c => {
      if (c.id !== id) return c
      return { ...c, files: [...c.files, ...Array.from(newFiles)] }
    }))
  }

  const removeFileFromCard = (cardId, fileIndex) => {
    setRecordCards(prev => prev.map(c => {
      if (c.id !== cardId) return c
      return { ...c, files: c.files.filter((_, i) => i !== fileIndex) }
    }))
  }

  const handleSubmitCard = async (card) => {
    if (!selectedPatientId || !card.title) {
      updateCard(card.id, 'status', 'error-fields')
      return
    }
    const formData = new FormData()
    formData.append('patient_id', selectedPatientId)
    formData.append('title', card.title)
    formData.append('record_type', card.record_type === 'Other' ? card.customType || 'Other' : card.record_type)
    formData.append('description', card.description)
    card.files.forEach(f => formData.append('files', f))
    try {
      await addRecord(formData)
      updateCard(card.id, 'status', 'success')
      if (selectedPatient) handleSelectPatient(selectedPatient)
      
      // Update the main record list if adding to the currently viewed patient
      if (selectedPatient && selectedPatient.patient_id === selectedPatientId) {
         const res = await getPatientRecords(selectedPatient.patient_id)
         setPatientRecords(res.data)
      }
    } catch { updateCard(card.id, 'status', 'error') }
  }

  const filteredPatients = approvedPatients.filter(p =>
    p.patient_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patient_email.toLowerCase().includes(patientSearch.toLowerCase())
  )

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
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] shrink-0 sticky top-0 h-screen shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="text-teal-400">
            {/* Health Cross / Doctor SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">MediPassport</h1>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2">
          {[
            { id: 'scan', label: 'Request Access', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg> },
            { id: 'patients', label: 'Approved Patients', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
            { id: 'addrecord', label: 'Add Records', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === item.id 
                ? 'bg-teal-900/40 text-teal-400 border-l-4 border-teal-500' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
              {item.id === 'patients' && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${activeTab === 'patients' ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-700 text-slate-300'}`}>
                   {approvedPatients.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold tracking-widest text-sm shadow-inner uppercase">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-200 truncate">Dr. {user?.name}</span>
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded-full w-fit mt-1">Provider</span>
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

      {/* Main Content Area */}
      <main className="flex-1 w-full max-h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-[#0F172A] text-white p-4 flex justify-between items-center sticky top-0 z-50">
           <div className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             <h1 className="font-extrabold tracking-tight">MediPassport</h1>
           </div>
           <button onClick={logout} className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-md text-red-300">Logout</button>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto bg-[#0F172A]/95 backdrop-blur-md sticky top-[60px] z-40 border-t border-slate-800">
           {[
             { id: 'scan', label: 'Access' }, 
             { id: 'patients', label: 'Patients' }, 
             { id: 'addrecord', label: 'Add Record' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap capitalize border-b-2 transition ${activeTab === tab.id ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400'}`}
             >
               {tab.label}
             </button>
           ))}
        </div>

        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out_forwards]">
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          
          {/* Top Doctor Header Card */}
          <div className="bg-gradient-to-r from-teal-800 to-[#0F172A] rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl border border-teal-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            {/* Background Pattern */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="squares" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="18" height="18" fill="currentColor" className="text-teal-200" rx="4"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#squares)" />
              </svg>
            </div>

            <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                   <p className="text-teal-300 text-sm font-bold tracking-widest uppercase">Provider Account</p>
                   {/* Doctor Badge */}
                   <span className="bg-teal-500 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                     Doctor
                   </span>
                 </div>
                 <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Dr. {user?.name}</h2>
                 <p className="text-teal-200 mt-2 font-medium">{user?.email}</p>
              </div>

              <div className="bg-white/10 border border-white/10 backdrop-blur-md px-6 py-4 rounded-3xl flex flex-col items-center justify-center min-w-[140px] shadow-lg">
                 <p className="text-teal-200 text-xs font-bold uppercase tracking-widest mb-1">Approved Patients</p>
                 <p className="text-4xl font-extrabold text-white">{approvedPatients.length}</p>
              </div>
            </div>
          </div>

          {/* TAB: REQUEST ACCESS */}
          {activeTab === 'scan' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 border border-slate-100 max-w-lg w-full text-center hover:shadow-2xl transition">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Request Patient Access</h3>
                <p className="text-slate-500 font-medium mb-8">Enter the patient's exact 8-character Health ID to request secure access to their medical records.</p>
                
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold">ID:</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. A1B2C3D4"
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white font-mono text-2xl font-extrabold tracking-widest uppercase transition-all shadow-sm text-center placeholder:text-slate-300 placeholder:font-sans placeholder:font-medium placeholder:text-lg"
                      value={healthId}
                      onChange={e => setHealthId(e.target.value.toUpperCase())}
                      maxLength={8}
                    />
                  </div>
                  
                  {accessStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl p-4 flex items-center gap-3 animate-[fadeIn_0.3s_ease-out_forwards]">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                      {accessMessage}
                    </div>
                  )}
                  {accessStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl p-4 flex items-center gap-3 animate-[fadeIn_0.3s_ease-out_forwards]">
                       <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                       {accessMessage}
                    </div>
                  )}
                  
                  <button 
                    onClick={handleRequestAccess} 
                    disabled={!healthId.trim()}
                    className="w-full bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl transition shadow-lg font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    Send Access Request
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: APPROVED PATIENTS */}
          {activeTab === 'patients' && (
            <div className="space-y-6">
              {approvedPatients.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold text-lg">No approved patients yet.</p>
                  <p className="text-slate-400 text-sm mt-2">Request access to patients using their Health ID.</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search patients by name or email..."
                      className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm transition-all text-sm font-semibold placeholder:text-slate-400"
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-5">
                    {filteredPatients.map(patient => (
                      <div key={patient.patient_id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
                        {/* Header Area */}
                        <div
                          onClick={() => handleSelectPatient(patient)}
                          className={`p-6 sm:p-8 cursor-pointer hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${selectedPatient?.patient_id === patient.patient_id ? 'bg-teal-50/30' : ''}`}
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-xl shadow-inner uppercase border border-slate-200">
                              {patient.patient_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-xl">{patient.patient_name}</p>
                              <p className="text-sm font-medium text-slate-500">{patient.patient_email}</p>
                              <div className="mt-2 text-xs font-mono font-bold bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-md w-fit tracking-widest uppercase">
                                ID: {patient.health_id}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 shadow-sm">
                               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                               ACCESS GRANTED
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedPatientId(patient.patient_id); setActiveTab('addrecord'); }}
                              className="text-xs font-bold bg-[#0F172A] text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-md flex items-center gap-2 uppercase tracking-wide"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                              New Record
                            </button>
                          </div>
                        </div>

                        {/* Expanded Records Inner Section */}
                        {selectedPatient?.patient_id === patient.patient_id && (
                          <div className="border-t border-slate-100 bg-slate-50 p-6 sm:p-8 animate-[fadeIn_0.3s_ease-out_forwards]">
                            <div className="flex items-center justify-between mb-6">
                              <p className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                                 <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                 Medical History
                              </p>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{patientRecords.length} Records</span>
                            </div>

                            {loadingRecords ? (
                              <div className="flex items-center justify-center gap-3 py-10 text-slate-500 bg-white rounded-2xl border border-slate-200">
                                 <svg className="animate-spin h-6 w-6 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                 <span className="text-sm font-bold">Synchronizing records...</span>
                              </div>
                            ) : patientRecords.length === 0 ? (
                              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
                                <p className="text-slate-500 text-sm font-bold">No records found for this patient yet.</p>
                              </div>
                            ) : (
                              <div className="space-y-5">
                                {patientRecords.map(r => (
                                  <div key={r.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 relative transition-all" style={{ borderLeftWidth: '6px', borderLeftColor: getRecordColor(r.record_type) }}>
                                    {editingRecord === r.id ? (
                                      <RecordEditForm
                                        record={r}
                                        onSave={async (id, formData) => {
                                          try {
                                            const res = await editRecord(id, formData)
                                            setPatientRecords(prev => prev.map(rec =>
                                              rec.id === id ? { ...rec, title: formData.get('title'), record_type: formData.get('record_type'), description: formData.get('description'), file_urls: res.data.file_urls } : rec
                                            ))
                                            setEditingRecord(null)
                                          } catch (err) { console.error(err) }
                                        }}
                                        onCancel={() => setEditingRecord(null)}
                                      />
                                    ) : (
                                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex-1 w-full">
                                          <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <p className="text-lg font-extrabold text-slate-800">{r.title}</p>
                                            <span 
                                              className="text-[10px] font-bold uppercase tracking-wider text-white px-3 py-1 rounded-full shadow-sm"
                                              style={{ backgroundColor: getRecordColor(r.record_type) }}
                                            >
                                              {r.record_type}
                                            </span>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 mb-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                          </div>

                                          <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-4">{r.description}</p>
                                          
                                          {r.file_urls && r.file_urls.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {r.file_urls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm group">
                                                  <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                  File {i + 1}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex gap-2 sm:flex-col lg:flex-row mt-4 sm:mt-0 opacity-100">
                                          <button onClick={() => openEdit(r)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-2 uppercase tracking-wide">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            Edit
                                          </button>
                                          <button onClick={() => handleDelete(r.id)} className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition shadow-sm flex items-center gap-2 uppercase tracking-wide">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredPatients.length === 0 && patientSearch && (
                      <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                        <p className="text-slate-500 font-bold">No patients match your search "{patientSearch}".</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: ADD RECORDS */}
          {activeTab === 'addrecord' && (
            <div className="space-y-6">
              {/* Patient Selection Area */}
              <div className="bg-[#0F172A] rounded-3xl shadow-xl border border-slate-800 p-8 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                   <svg className="w-40 h-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <h3 className="text-xl font-extrabold text-white mb-6">Select Patient for New Record</h3>
                
                <div className="grid md:grid-cols-2 gap-6 relative z-10">
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     </div>
                     <input
                       type="text"
                       placeholder="Filter by name..."
                       className="w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold text-white placeholder-slate-400 transition-all shadow-inner"
                       value={patientSearch}
                       onChange={e => setPatientSearch(e.target.value)}
                     />
                  </div>
                  <div className="relative">
                    <select
                      className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 shadow-xl appearance-none cursor-pointer"
                      value={selectedPatientId}
                      onChange={e => setSelectedPatientId(e.target.value)}
                    >
                      <option value="" disabled className="text-slate-400">Choose a Patient...</option>
                      {filteredPatients.map(p => (
                        <option key={p.patient_id} value={p.patient_id}>{p.patient_name} ({p.patient_email})</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                
                {!selectedPatientId && (
                  <p className="mt-4 text-amber-300 text-sm font-medium flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                     Please select a patient before adding record details.
                  </p>
                )}
              </div>

              {/* Record Input Cards */}
              <div className="space-y-6 lg:ml-8 lg:border-l-2 lg:border-dashed lg:border-slate-200 lg:pl-8 py-4 relative">
                {recordCards.map((card, index) => (
                  <div key={card.id} className={`bg-white rounded-3xl shadow-lg border p-6 sm:p-10 relative transition-all ${card.status === 'success' ? 'border-green-200 shadow-green-100/50' : 'border-slate-200'}`}>
                    {/* Visual Connector for Desktop */}
                    <div className="hidden lg:flex absolute top-12 -left-8 w-8 items-center">
                       <div className="w-full h-0.5 bg-slate-200 border-dashed border-t-2"></div>
                       <div className="w-3 h-3 rounded-full bg-slate-300 -ml-1"></div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-extrabold text-xl text-slate-800 flex items-center gap-3">
                        <span className="bg-[#0F172A] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md">{index + 1}</span>
                        Record Details
                      </h4>
                      {recordCards.length > 1 && (
                        <button onClick={() => setRecordCards(prev => prev.filter(c => c.id !== card.id))} className="text-xs font-bold text-red-500 hover:text-white bg-red-50 hover:bg-red-500 px-4 py-2 rounded-xl transition shadow-sm uppercase tracking-wide">
                          Remove Entry
                        </button>
                      )}
                    </div>

                    {card.status === 'success' && <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl px-5 py-4 mb-6 shadow-sm flex items-center gap-3"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> Record saved successfully!</div>}
                    {card.status === 'error' && <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl px-5 py-4 mb-6 shadow-sm flex items-center gap-3"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg> Failed to save. Please try again.</div>}
                    {card.status === 'error-fields' && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold rounded-xl px-5 py-4 mb-6 shadow-sm flex items-center gap-3"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> Ensure a patient is selected and title is provided.</div>}

                    <div className="grid sm:grid-cols-2 gap-6 mb-8">
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide">Title <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="e.g. Annual Bloodwork" className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm" value={card.title} onChange={e => updateCard(card.id, 'title', e.target.value)} disabled={card.status === 'success'} />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide">Category</label>
                        <div className="relative">
                          <select className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm appearance-none" value={card.record_type} onChange={e => updateCard(card.id, 'record_type', e.target.value)} disabled={card.status === 'success'}>
                            {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                        {card.record_type === 'Other' && (
                          <input type="text" placeholder="Specify custom category..." className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm mt-3" value={card.customType} onChange={e => updateCard(card.id, 'customType', e.target.value)} disabled={card.status === 'success'} />
                        )}
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide">Clinical Notes</label>
                        <textarea placeholder="Enter detailed observations, diagnoses, or instructions..." rows={4} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl px-5 py-4 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-sm resize-none leading-relaxed" value={card.description} onChange={e => updateCard(card.id, 'description', e.target.value)} disabled={card.status === 'success'} />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-extrabold text-slate-700 mb-3 uppercase tracking-wide">Attachments</label>
                        
                        {card.files.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {card.files.map((file, fi) => (
                              <div key={fi} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                   <div className="p-2 bg-slate-100 text-slate-600 rounded-lg flex-shrink-0">
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                   </div>
                                   <div className="overflow-hidden">
                                     <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                                     <p className="text-xs text-slate-400 font-bold">{(file.size / 1024).toFixed(1)} KB</p>
                                   </div>
                                </div>
                                {card.status !== 'success' && (
                                  <button onClick={() => removeFileFromCard(card.id, fi)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition" title="Remove File">
                                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {card.status !== 'success' && (
                          <label className="relative flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl hover:bg-teal-50 focus-within:ring-4 focus-within:ring-teal-500/20 focus-within:border-teal-500 cursor-pointer transition-colors group">
                            <div className="p-4 bg-white text-teal-600 rounded-full shadow-md mb-4 group-hover:scale-110 transition-transform">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            </div>
                            <p className="text-sm font-extrabold text-slate-700 mb-1">Click or drag files to upload</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">JPG, PNG, PDF (Max 10MB)</p>
                            <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.gif,.webp" className="hidden" onChange={e => { if (e.target.files?.length) addFileToCard(card.id, e.target.files); }} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleSubmitCard(card)}
                        disabled={card.status === 'success' || !selectedPatientId}
                        className={`px-10 py-4 rounded-xl transition text-sm font-extrabold uppercase tracking-widest shadow-md flex items-center gap-2 ${
                          card.status === 'success' 
                          ? 'bg-green-100 text-green-700 cursor-not-allowed shadow-none' 
                          : !selectedPatientId 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#0F172A] text-white hover:bg-slate-800 hover:shadow-xl active:scale-[0.98]'
                        }`}
                      >
                        {card.status === 'success' ? (
                          <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> RECORD SAVED</>
                        ) : (
                          <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg> SUBMIT RECORD</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setRecordCards(prev => [...prev, emptyRecord()])} 
                  className="w-full border-2 border-dashed border-slate-300 text-slate-500 py-6 rounded-3xl hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition text-sm font-extrabold uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"></path></svg>
                  ADD ANOTHER ENTRY
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}