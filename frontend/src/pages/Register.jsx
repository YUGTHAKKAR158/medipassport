import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/api'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await registerUser(form)
      setSuccess('Account created! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError('Registration failed. Email may already be used.')
    }
  }

  return (
    <div className="flex min-h-screen font-sans animate-[fadeIn_0.6s_ease-out_forwards] bg-white">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Left Panel - Deep Navy Blue */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] flex-col justify-center items-start p-16 xl:p-24 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-blue-400/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10 w-full max-w-lg mx-auto">
          {/* Medical Cross Icon */}
          <div className="mb-10 text-blue-500 bg-blue-500/10 inline-block p-4 rounded-2xl shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
             </svg>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Join thousands managing their <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">health digitally</span>
          </h1>
          
          <ul className="space-y-6 mt-12">
            {[
              "Secure cloud storage",
              "Share with any doctor",
              "Emergency access anytime"
            ].map((text, idx) => (
              <li key={idx} className="flex items-center text-lg text-slate-300 font-medium tracking-wide">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400 mr-4 shadow-inner">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">MediPassport</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create an account</h2>
            <p className="text-slate-500">Sign up to get started</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                </div>
                <div className="ml-3 text-sm text-red-700 font-medium">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM13.707 8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                </div>
                <div className="ml-3 text-sm text-green-700 font-medium">{success}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setForm({ ...form, role: 'patient' })}
                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${form.role === 'patient' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className={`${form.role === 'patient' ? 'text-blue-600' : 'text-slate-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <span className={`font-semibold text-sm ${form.role === 'patient' ? 'text-blue-900' : 'text-slate-600'}`}>Patient</span>
              </div>
              
              <div 
                onClick={() => setForm({ ...form, role: 'doctor' })}
                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${form.role === 'doctor' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className={`${form.role === 'doctor' ? 'text-blue-600' : 'text-slate-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <span className={`font-semibold text-sm ${form.role === 'doctor' ? 'text-blue-900' : 'text-slate-600'}`}>Doctor</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-slate-50 focus:bg-white shadow-sm"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-slate-50 focus:bg-white shadow-sm"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-slate-50 focus:bg-white shadow-sm"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:shadow-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98]"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}