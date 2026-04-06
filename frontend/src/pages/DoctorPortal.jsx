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
    } catch { updateCard(card.id, 'status', 'error') }
  }

  const filteredPatients = approvedPatients.filter(p =>
    p.patient_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patient_email.toLowerCase().includes(patientSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-600">MediPassport</h1>
          <p className="text-xs text-gray-400">Doctor Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Dr. {user?.name}</span>
          <button onClick={logout} className="text-sm bg-red-50 text-red-500 px-3 py-1 rounded-lg hover:bg-red-100 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="bg-teal-600 text-white rounded-2xl p-6 mb-8 flex justify-between items-center">
          <div>
            <p className="text-teal-200 text-sm mb-1">Doctor Account</p>
            <p className="font-bold text-lg">Dr. {user?.name}</p>
            <p className="text-teal-200 text-xs mt-1">{user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-teal-200 text-xs mb-1">Approved Patients</p>
            <p className="text-3xl font-bold">{approvedPatients.length}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'scan', label: 'Request Access' },
            { key: 'patients', label: 'Approved Patients (' + approvedPatients.length + ')' },
            { key: 'addrecord', label: 'Add Records' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                'px-4 py-2 rounded-lg text-sm font-medium transition ' +
                (activeTab === tab.key ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Request Access Tab */}
        {activeTab === 'scan' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-700 font-semibold mb-1">Request Patient Access</h2>
            <p className="text-gray-400 text-sm mb-5">Enter the patient Health ID from their QR code.</p>
            <label className="text-sm text-gray-600 font-medium">Patient Health ID</label>
            <input
              type="text"
              placeholder="Paste the patient Health ID here..."
              className="w-full border rounded-lg px-4 py-2 mt-1 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono"
              value={healthId}
              onChange={e => setHealthId(e.target.value)}
            />
            {accessStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">{accessMessage}</div>
            )}
            {accessStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{accessMessage}</div>
            )}
            <button onClick={handleRequestAccess} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition text-sm font-medium">
              Send Access Request
            </button>
          </div>
        )}

        {/* Approved Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            {approvedPatients.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-400">No approved patients yet.</p>
              </div>
            ) : (
              <>
                {/* Search bar */}
                <input
                  type="text"
                  placeholder="Search patients by name or email..."
                  className="w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                />

                <div className="grid gap-3">
                  {filteredPatients.map(patient => (
                    <div
                      key={patient.patient_id}
                      onClick={() => handleSelectPatient(patient)}
                      className={
                        'bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition border-2 ' +
                        (selectedPatient && selectedPatient.patient_id === patient.patient_id ? 'border-teal-400' : 'border-transparent')
                      }
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{patient.patient_name}</p>
                          <p className="text-sm text-gray-400">{patient.patient_email}</p>
                          <p className="text-xs font-mono text-gray-300 mt-1">{patient.health_id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium">Access Approved</span>
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedPatientId(patient.patient_id); setActiveTab('addrecord') }}
                            className="text-xs bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700"
                          >
                            Add Record
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredPatients.length === 0 && (
                    <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                      <p className="text-gray-400 text-sm">No patients match your search.</p>
                    </div>
                  )}
                </div>

                {/* Selected patient records */}
                {selectedPatient && (
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <p className="font-semibold text-gray-700 mb-4">Records for {selectedPatient.patient_name}</p>
                    {loadingRecords ? (
                      <p className="text-gray-400 text-sm">Loading...</p>
                    ) : patientRecords.length === 0 ? (
                      <p className="text-gray-400 text-sm">No records found for this patient yet.</p>
                    ) : (
                      patientRecords.map(r => (
                        <div key={r.id} className="py-4 border-b last:border-0">
                          {editingRecord === r.id ? (
                            <RecordEditForm
                              record={r}
                              onSave={async (id, formData) => {
                                try {
                                  const res = await editRecord(id, formData)
                                  setPatientRecords(prev => prev.map(rec =>
                                    rec.id === id
                                      ? { ...rec, title: formData.get('title'), record_type: formData.get('record_type'), description: formData.get('description'), file_urls: res.data.file_urls }
                                      : rec
                                  ))
                                  setEditingRecord(null)
                                } catch (err) { console.error(err) }
                              }}
                              onCancel={() => setEditingRecord(null)}
                            />
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-gray-800">{r.title}</p>
                                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{r.record_type}</span>
                                </div>
                                <p className="text-xs text-gray-500">{r.description}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(r.date).toLocaleDateString()}</p>
                                {r.file_urls && r.file_urls.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {r.file_urls.map((url, i) => (
                                      <a
                                        key={i}
                                        href={'http://localhost:5000' + url}
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
                              <div className="flex gap-2 ml-4">
                                <button onClick={() => openEdit(r)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">Edit</button>
                                <button onClick={() => handleDelete(r.id)} className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-lg hover:bg-red-100 transition">Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Add Records Tab */}
        {activeTab === 'addrecord' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <label className="text-sm text-gray-600 font-medium">Search and Select Patient</label>
              <input
                type="text"
                placeholder="Type to search patient by name or email..."
                className="w-full border rounded-lg px-4 py-2 mt-1 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
              <select
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
              >
                <option value="">-- Select a patient --</option>
                {filteredPatients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>{p.patient_name} — {p.patient_email}</option>
                ))}
              </select>
            </div>

            {recordCards.map((card, index) => (
              <div key={card.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-semibold text-gray-700">Record {index + 1}</p>
                  {recordCards.length > 1 && (
                    <button onClick={() => setRecordCards(prev => prev.filter(c => c.id !== card.id))} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg">Remove</button>
                  )}
                </div>

                {card.status === 'success' && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">Record added successfully!</div>}
                {card.status === 'error' && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">Failed to add record. Check access permissions.</div>}
                {card.status === 'error-fields' && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg px-4 py-3 mb-4">Please select a patient and fill in the title.</div>}

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Record Title</label>
                    <input type="text" placeholder="e.g. Blood Test Report" className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" value={card.title} onChange={e => updateCard(card.id, 'title', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Record Type</label>
                    <select className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" value={card.record_type} onChange={e => updateCard(card.id, 'record_type', e.target.value)}>
                      {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    {card.record_type === 'Other' && (
                      <input type="text" placeholder="Specify record type..." className="w-full border rounded-lg px-4 py-2 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" value={card.customType} onChange={e => updateCard(card.id, 'customType', e.target.value)} />
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Description / Notes</label>
                    <textarea placeholder="Write diagnosis, observations or instructions..." rows={3} className="w-full border rounded-lg px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" value={card.description} onChange={e => updateCard(card.id, 'description', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Attach Files</label>
                    <p className="text-xs text-gray-400 mb-2">Supports JPG, PNG, PDF, GIF. Multiple files allowed.</p>
                    {card.files.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {card.files.map((file, fi) => (
                          <div key={fi} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border">
                            <span className="text-xs text-gray-500 font-mono truncate max-w-xs">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                            <button onClick={() => removeFileFromCard(card.id, fi)} className="text-red-400 hover:text-red-600 text-xs font-medium ml-2">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-2 border border-dashed border-teal-400 text-teal-600 text-sm px-4 py-2 rounded-lg hover:bg-teal-50 transition">
                      + Add File
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.gif,.webp" className="hidden" onChange={e => addFileToCard(card.id, e.target.files)} />
                    </label>
                  </div>
                  <button
                    onClick={() => handleSubmitCard(card)}
                    disabled={card.status === 'success'}
                    className={'w-full py-2 rounded-lg transition text-sm font-medium ' + (card.status === 'success' ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700')}
                  >
                    {card.status === 'success' ? 'Record Saved' : 'Save This Record'}
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => setRecordCards(prev => [...prev, emptyRecord()])} className="w-full border-2 border-dashed border-teal-300 text-teal-500 py-3 rounded-xl hover:bg-teal-50 transition text-sm font-medium">
              + Add Another Record
            </button>
          </div>
        )}
      </div>
    </div>
  )
}