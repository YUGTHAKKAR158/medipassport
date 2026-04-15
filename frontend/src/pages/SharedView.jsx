import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSharedRecord } from '../services/api'

export default function SharedView() {
  const { token } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await getSharedRecord(token)
        setRecord(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Shared record unavailable.')
      } finally {
        setLoading(false)
      }
    }
    fetchRecord()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Link Expired or Invalid</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Go to MediPassport</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">MediPassport</h1>
            <p className="text-sm text-slate-500">Secure Shared Record</p>
          </div>
          <div className="bg-green-100 text-green-700 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border border-green-200">
            Active Link
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 px-6 py-8 text-white relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-[100%] h-[200%] bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="bg-blue-500 bg-opacity-50 border border-blue-400 text-xs text-white px-3 py-1 rounded-full uppercase tracking-widest font-bold mb-3 inline-block">
                  {record.record_type}
                </span>
                <h2 className="text-3xl font-bold mb-1">{record.title}</h2>
                <p className="text-blue-200 text-sm">
                  Date recorded: {record.date ? new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Notes / Description</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{record.description || 'No additional notes provided.'}</p>
            </div>

            {record.file_urls && record.file_urls.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Attached Files ({record.file_urls.length})</h3>
                <div className="grid gap-3">
                  {record.file_urls.map((url, i) => (
                    <a 
                      key={i} 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">Attachment {i + 1}</p>
                          <p className="text-xs text-slate-500">Tap to view original file</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-400">
          <p>This is a temporary secure link provided via MediPassport.</p>
          <p className="mt-1"><Link to="/" className="text-blue-500 hover:underline">Learn more about MediPassport</Link></p>
        </div>

      </div>
    </div>
  )
}
