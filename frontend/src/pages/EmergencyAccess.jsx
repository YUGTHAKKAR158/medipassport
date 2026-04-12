import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getEmergencyProfile } from '../services/api'

export default function EmergencyAccess() {
  const { healthId } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getEmergencyProfile(healthId)
        setProfile(res.data)
      } catch (err) {
        setError('Patient not found')
      } finally {
        setLoading(false)
      }
    }
    if (healthId) {
      fetchProfile()
    } else {
      setError('Patient not found')
      setLoading(false)
    }
  }, [healthId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans">
        <svg className="animate-spin h-12 w-12 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-white font-bold tracking-widest uppercase">Fetching Emergency Data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans text-center px-4">
        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-3xl w-full max-w-md">
          <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-3xl font-extrabold text-white mb-2">{error}</h2>
          <p className="text-slate-400 mb-8 font-medium">The requested health profile could not be retrieved.</p>
          <Link to="/" className="inline-block bg-slate-800 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-700 transition">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const {
    patient_name,
    blood_group,
    allergies,
    emergency_contact_name,
    emergency_contact_phone,
    health_id
  } = profile

  const hasBloodGroup = blood_group && blood_group !== 'Not specified'
  const hasAllergies = allergies && allergies !== 'None recorded'

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans flex flex-col">
      {/* Banner */}
      <div className="bg-red-600 text-white py-6 px-4 shadow-[0_4px_20px_rgba(220,38,38,0.4)] text-center relative z-10 border-b border-red-500">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest uppercase mb-1 flex items-center justify-center gap-3">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          Emergency Medical Access
        </h1>
        <p className="font-bold text-red-100 text-sm sm:text-base tracking-wide mt-2">
          This information is provided for emergency medical use only
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-8 flex flex-col">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border-t-8 border-red-600 w-full animate-[fadeIn_0.5s_ease-out_forwards]">
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          
          <div className="mb-8 border-b border-slate-100 pb-6">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Patient Name</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">{patient_name}</h2>
            <p className="text-sm font-mono font-bold text-slate-400 mt-2">ID: {health_id}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-3">Blood Group</p>
              <div className="flex items-center gap-3">
                 <div className={`text-2xl font-extrabold py-2 px-4 rounded-xl shadow-sm border ${hasBloodGroup ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                   {blood_group || 'Not specified'}
                 </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-3">Allergies</p>
              <div className={`p-4 rounded-xl text-sm font-bold border shadow-sm ${hasAllergies ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                {allergies || 'None recorded'}
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-inner">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none w-32 h-32 transform translate-x-8 translate-y-8">
               <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M11 7h2v6h-2zm0 8h2v2h-2z"/></svg>
            </div>
            
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
               <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
               Emergency Contact
            </p>
            
            <div className="relative z-10">
              <p className="text-xl sm:text-2xl font-extrabold text-white mb-1">
                {emergency_contact_name || 'Not provided'}
              </p>
              {emergency_contact_phone ? (
                <a href={`tel:${emergency_contact_phone.replace(/[^0-9+]/g, '')}`} className="text-red-400 hover:text-red-300 font-mono text-lg sm:text-xl font-bold transition">
                  {emergency_contact_phone}
                </a>
              ) : (
                <p className="text-slate-500 font-mono font-bold">No phone number</p>
              )}
            </div>
          </div>
        </div>
        
        <footer className="mt-auto pt-8 pb-4 text-center">
          <p className="text-slate-500 font-bold text-sm tracking-wide">
            Powered by MediPassport — For emergency use only
          </p>
        </footer>
      </div>
    </div>
  )
}
