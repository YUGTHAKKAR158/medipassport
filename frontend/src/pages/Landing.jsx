import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-800">
      <style>
        {`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up { animation: fadeUp 0.8s ease-out forwards; }
          .animation-delay-200 { animation-delay: 0.2s; opacity: 0; }
          .animation-delay-400 { animation-delay: 0.4s; opacity: 0; }
        `}
      </style>

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">MediPassport</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">Log in</Link>
          <Link to="/register" className="text-sm font-bold bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:brightness-110 transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32 px-4 bg-slate-50">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
          <div className="w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
          <div className="w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8 relative z-10">
          <div className="flex-1 text-center lg:text-left animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              The Future of Healthcare
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Your Medical Records, <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Borderless.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Carry your complete medical history securely in your pocket. Instantly share access with any doctor anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all text-center text-lg">
                Create Free Account
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all text-center text-lg flex items-center justify-center gap-2">
                Log in
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-none animate-fade-up animation-delay-200 flex justify-center lg:justify-end">
            {/* CSS Mockup of Dashboard */}
            <div className="relative border-slate-900 bg-slate-900 border-[8px] rounded-[2.5rem] h-[550px] max-w-[320px] w-full shadow-2xl overflow-hidden transform rotate-2 lg:rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="w-[120px] h-[20px] bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-[1rem] z-20"></div>
              <div className="bg-slate-50 w-full h-full relative z-10 flex flex-col font-sans">
                {/* Mock Navbar */}
                <div className="bg-[#0F172A] px-4 pt-10 pb-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-sm">MediPassport</h3>
                      <p className="text-[10px] text-blue-300 font-medium">Patient Portal</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">P</div>
                  </div>
                </div>
                
                {/* Mock Content */}
                <div className="p-4 flex-1 overflow-hidden space-y-4">
                  <div className="bg-gradient-to-r from-blue-900 to-[#0F172A] rounded-xl p-4 text-white shadow-lg relative overflow-hidden border border-blue-800">
                    <div className="absolute top-[-50%] right-[-10%] w-32 h-32 bg-blue-500/30 rounded-full blur-2xl"></div>
                    <p className="text-[10px] text-blue-300 font-semibold mb-1 uppercase tracking-wider relative z-10">Your Health ID</p>
                    <div className="flex items-center gap-2 relative z-10">
                      <p className="font-mono text-xl font-extrabold tracking-widest bg-white/10 px-2 py-1 rounded text-white border border-white/20">AX-789-214</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 border-b border-slate-200 pb-px">
                     <div className="text-[10px] font-bold text-blue-600 border-b-2 border-blue-600 pb-1 px-1">Overview</div>
                     <div className="text-[10px] font-bold text-slate-400 pb-1 px-1">Records</div>
                  </div>

                  <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-500 font-medium">Total Records</p>
                       <p className="font-bold text-slate-800 text-sm">12</p>
                     </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 shadow-sm border-l-4 border-l-green-500 border-y border-y-slate-100 border-r border-r-slate-100">
                     <p className="font-bold text-slate-800 text-xs">Prescription - Dr. Smith</p>
                     <p className="text-[9px] text-slate-500 mb-1">General checkup medication</p>
                     <div className="flex gap-1 mt-2">
                       <div className="bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-bold px-2 py-0.5 rounded">File 1</div>
                     </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-3 shadow-sm border-l-4 border-l-blue-500 border-y border-y-slate-100 border-r border-r-slate-100">
                     <p className="font-bold text-slate-800 text-xs">Blood Test Results</p>
                     <p className="text-[9px] text-slate-500 mb-1">Annual screening</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-[#0F172A] py-24 px-6 text-white relative border-t-[8px] border-[#2563EB]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Why Choose MediPassport?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">Designed for both patients and healthcare providers to ensure secure, instant access to medical history.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-xl">
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Patient-Owned Data</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Centralize your lab reports, prescriptions, and notes in one place. You control who has access to your health history.</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-xl">
              <div className="w-14 h-14 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center mb-6 border border-teal-500/30">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Instant Doctor Access</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Doctors can scan your QR code or enter your Health ID to request temporary access, enabling faster, informed diagnosis.</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-xl">
              <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6 border border-purple-500/30">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Bank-Grade Security</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Your data is heavily encrypted. Access is strictly permission-based, ensuring your sensitive records remain private.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white overflow-hidden relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full scale-150 -translate-x-1/4"></div>
            <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80" alt="Doctor and Patient" className="relative z-10 rounded-3xl shadow-2xl object-cover h-[450px] w-full" />
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl z-20 border border-slate-100 animate-fade-up">
              <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Access Granted</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-green-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <p className="font-extrabold text-slate-800 text-lg">Records Shared</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">How It Works</h2>
              <p className="text-slate-600 text-lg font-medium">A simple 3-step process to modernize your healthcare journey.</p>
            </div>
            <div className="space-y-8">
              {[
                { step: '01', title: 'Create an Account', desc: 'Sign up as a patient and receive your unique, permanent Health ID.' },
                { step: '02', title: 'Upload Records', desc: 'Add past prescriptions, lab reports, and doctor notes to your secure vault.' },
                { step: '03', title: 'Share Instantly', desc: 'Visit any clinic and let the doctor scan your QR code to instantly verify and view your history.' }
              ].map(item => (
                <div key={item.step} className="flex gap-6 group">
                  <div className="text-4xl font-extrabold text-blue-100 group-hover:text-blue-500 transition-colors">{item.step}</div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h4>
                    <p className="text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span className="text-xl font-extrabold text-slate-900">MediPassport</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">© {new Date().getFullYear()} MediPassport. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
