import { useState, useEffect } from 'react'

let toastFn = null

export function useToast() {
  return {
    success: (msg) => toastFn && toastFn({ message: msg, type: 'success' }),
    error: (msg) => toastFn && toastFn({ message: msg, type: 'error' }),
    info: (msg) => toastFn && toastFn({ message: msg, type: 'info' }),
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastFn = ({ message, type }) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
    return () => { toastFn = null }
  }, [])

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={'text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-64 ' + colors[toast.type]}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}