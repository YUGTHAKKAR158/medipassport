import axios from 'axios'

const API = axios.create({
  baseURL: window.location.hostname === 'localhost' && window.location.port === '5173'
    ? 'http://localhost:5000/api'
    : '/api',
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const registerUser = (data) => API.post('/auth/register', data)
export const loginUser = (data) => API.post('/auth/login', data)
export const getRecords = () => API.get('/records')
export const getQRCode = (patientId) => API.get('/qr/' + patientId)
export const requestAccess = (healthId) => API.post('/access/request', { health_id: healthId })
export const respondAccess = (requestId, status) => API.post('/access/respond', { request_id: requestId, status })
export const getPendingRequests = () => API.get('/access/pending')
export const getApprovedPatients = (doctorId) => API.get('/access/approved/' + doctorId)
export const getPatientRecords = (patientId) => API.get('/records/patient/' + patientId)
export const addRecord = (formData) => API.post('/records', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const editRecord = (recordId, formData) => API.put('/records/' + recordId, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteRecord = (recordId) => API.delete('/records/' + recordId)