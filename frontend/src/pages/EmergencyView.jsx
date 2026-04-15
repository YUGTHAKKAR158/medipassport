import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getEmergencyInfo } from '../services/api'

export default function EmergencyView() {
  const { healthId } = useParams()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInfo()
  }, [healthId])

  const fetchInfo = async () => {
    try {
      const res = await getEmergencyInfo(healthId)
      setInfo(res.data)
    } catch (err) {
      setError('Patient not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
        <p className="mt-8 text-red-500 text-lg font-mono tracking-widest animate-pulse">ACCESSING RECORDS...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center bg-slate-900 border border-red-900/50 p-8 rounded-3xl max-w-md w-full shadow-[0_0_30px_rgba(220,38,38,0.15)]">
          <div className="w-20 h-20 bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-white text-2xl font-bold mb-2">Patient Not Found</p>
          <p className="text-slate-400">Invalid or expired QR code</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-red-500/30">
      {/* Background ambient glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full animate-pulse object-cover"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 relative">
        
        {/* Pulsing Emergency Header */}
        <div className="relative mb-8 pt-4">
          <div className="absolute inset-0 bg-red-600 blur-xl opacity-20 animate-pulse rounded-full"></div>
          <div className="relative bg-gradient-to-b from-red-600 to-red-800 border border-red-500/50 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(220,38,38,0.3)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none"></div>
            
            <div className="flex justify-center mb-4 relative z-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            
            <p className="text-red-200 text-xs font-black tracking-[0.2em] mb-3 relative z-10">EMERGENCY MEDICAL INFO</p>
            <h1 className="text-white text-4xl font-extrabold tracking-tight drop-shadow-md relative z-10">{info.name}</h1>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Blood Type Card - Critical */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-colors duration-500">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
            <div className="flex items-center justify-between pl-4">
              <div>
                <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">Blood Type</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-white drop-shadow-[0_2px_10px_rgba(220,38,38,0.4)]">{info.blood_type || 'Unknown'}</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Allergies Card - Critical */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {info.allergies && info.allergies !== 'None recorded' && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
            )}
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-3">Critical Allergies</p>
            
            {info.allergies && info.allergies !== 'None recorded' ? (
              <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 flex gap-4 items-start">
                <div className="mt-1">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
                <div>
                  <p className="text-red-400 font-bold uppercase tracking-wide text-sm mb-1">Anaphylaxis Risk</p>
                  <p className="text-white text-lg font-medium leading-tight">{info.allergies}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">No critical allergies reported</p>
            )}
          </div>

          {/* Emergency Contact */}
          {info.emergency_contact_phone && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative mt-8 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-600/10 transition-colors"></div>
              
              <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">Emergency Contact</p>
              
              <div className="flex flex-col mb-5">
                <p className="text-white text-xl font-bold">{info.emergency_contact_name || 'Emergency Contact'}</p>
                <p className="text-slate-400 text-sm mt-1">Primary emergency contact</p>
              </div>

              <a
                href={'tel:' + info.emergency_contact_phone}
                className="group/btn relative w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-950 font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-[0_5px_15px_rgba(255,255,255,0.1)] hover:shadow-[0_5px_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
              >
                <svg className="w-6 h-6 text-blue-600 group-hover/btn:scale-110 group-hover/btn:rotate-[-5deg] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-lg">Call {info.emergency_contact_phone}</span>
                <div className="absolute inset-0 rounded-2xl border-2 border-white/50 opacity-0 group-hover/btn:opacity-100 group-hover/btn:scale-105 transition-all duration-300 pointer-events-none"></div>
              </a>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-12 text-center opacity-60">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest">MediPassport Secure</p>
          </div>
          <p className="text-slate-500 text-xs">This record is verified and authorized for emergency medical use only. No login required.</p>
        </div>

      </div>
    </div>
  )
}