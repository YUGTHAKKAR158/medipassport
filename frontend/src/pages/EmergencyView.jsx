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
  }, [])

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
      <div className="min-h-screen bg-red-600 flex items-center justify-center">
        <p className="text-white text-lg">Loading emergency information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl font-bold">Patient Not Found</p>
          <p className="text-gray-400 mt-2">Invalid or expired QR code</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Emergency Header */}
        <div className="bg-red-600 rounded-2xl p-6 mb-4 text-center">
          <p className="text-red-200 text-xs font-bold tracking-widest mb-1">EMERGENCY MEDICAL INFORMATION</p>
          <p className="text-white text-2xl font-bold">{info.name}</p>
          {info.date_of_birth && (
            <p className="text-red-200 text-sm mt-1">
              DOB: {new Date(info.date_of_birth).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Blood Type — most critical */}
        <div className="bg-white rounded-2xl p-6 mb-4 text-center">
          <p className="text-gray-400 text-xs font-bold tracking-widest">BLOOD TYPE</p>
          <p className="text-6xl font-bold text-red-600 mt-2">{info.blood_type || 'Unknown'}</p>
        </div>

        {/* Allergies — second most critical */}
        <div className={
          'rounded-2xl p-6 mb-4 ' +
          (info.allergies && info.allergies !== 'None recorded'
            ? 'bg-red-50 border-2 border-red-400'
            : 'bg-white')
        }>
          <p className="text-xs font-bold tracking-widest text-gray-500 mb-2">KNOWN ALLERGIES</p>
          {info.allergies && info.allergies !== 'None recorded' ? (
            <div>
              <p className="text-red-700 font-bold text-lg">ALERT</p>
              <p className="text-red-600 font-medium mt-1">{info.allergies}</p>
            </div>
          ) : (
            <p className="text-gray-500">No known allergies on record</p>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <p className="text-xs font-bold tracking-widest text-gray-500 mb-2">CHRONIC CONDITIONS</p>
          <p className="text-gray-700">{info.chronic_conditions || 'None recorded'}</p>
        </div>

        {/* Current Medications */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <p className="text-xs font-bold tracking-widest text-gray-500 mb-2">CURRENT MEDICATIONS</p>
          <p className="text-gray-700">{info.current_medications || 'None recorded'}</p>
        </div>

        {/* Emergency Contact */}
        {info.emergency_contact_name && (
          <div className="bg-blue-600 rounded-2xl p-6 mb-4">
            <p className="text-blue-200 text-xs font-bold tracking-widest mb-2">EMERGENCY CONTACT</p>
            <p className="text-white font-bold text-lg">{info.emergency_contact_name}</p>
            <a
              href={'tel:' + info.emergency_contact_phone}
              className="inline-block mt-2 bg-white text-blue-600 font-bold px-6 py-2 rounded-xl hover:bg-blue-50 transition"
            >
              Call {info.emergency_contact_phone}
            </a>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-gray-600 text-xs">Powered by MediPassport</p>
          <p className="text-gray-600 text-xs mt-1">This information is provided for emergency medical use only</p>
        </div>

      </div>
    </div>
  )
}