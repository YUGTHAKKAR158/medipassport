import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProfile, saveProfile } from '../services/api'
import { useNavigate } from 'react-router-dom'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']

export default function PatientProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    blood_type: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    date_of_birth: '',
    gender: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await getProfile()
      if (res.data && Object.keys(res.data).length > 0) {
        setForm(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveProfile(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-blue-600">
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-blue-600">MediPassport</h1>
            <p className="text-xs text-gray-400">Health Profile</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-sm bg-red-50 text-red-500 px-3 py-1 rounded-lg hover:bg-red-100">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Critical Info Banner */}
        {form.allergies && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-semibold text-sm">Critical Allergies</p>
            <p className="text-red-600 text-sm mt-1">{form.allergies}</p>
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6 text-sm font-medium">
            Profile saved successfully!
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-gray-700 font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium">Date of Birth</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.date_of_birth}
                onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Gender</label>
              <select
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Blood Type</label>
              <select
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.blood_type}
                onChange={e => setForm({ ...form, blood_type: e.target.value })}
              >
                <option value="">Select blood type</option>
                {BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-gray-700 font-semibold mb-4">Medical Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium">
                Known Allergies
                <span className="text-red-500 ml-1">— critical for doctors</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Penicillin (anaphylaxis), Peanuts, Sulfa drugs..."
                className="w-full border border-red-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                value={form.allergies}
                onChange={e => setForm({ ...form, allergies: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Chronic Conditions</label>
              <textarea
                rows={2}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma..."
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                value={form.chronic_conditions}
                onChange={e => setForm({ ...form, chronic_conditions: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Current Medications</label>
              <textarea
                rows={2}
                placeholder="e.g. Metformin 500mg twice daily, Amlodipine 5mg once daily..."
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                value={form.current_medications}
                onChange={e => setForm({ ...form, current_medications: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-gray-700 font-semibold mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium">Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel (Father)"
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.emergency_contact_name}
                onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Contact Phone</label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.emergency_contact_phone}
                onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}