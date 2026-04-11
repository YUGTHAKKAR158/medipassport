import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await loginUser(form)
      login(res.data.user, res.data.token)
      if (res.data.user.role === 'patient') navigate('/dashboard')
      else navigate('/doctor')
    } catch (err) {
      setError('Invalid email or password')
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
        {/* Background Subtle Gradient Glow */}
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
            Your health history, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">always with you</span>
          </h1>
          
          <ul className="space-y-6 mt-12">
            {[
              "Universal access",
              "Patient-owned data",
              "Doctor verified records"
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

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo with Pulse/Heartbeat SVG */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">MediPassport</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="ml-3 text-sm text-red-700 font-medium">
                  {error}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white shadow-sm"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white shadow-sm"
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
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
              Register now
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}