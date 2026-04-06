import { useState } from 'react'

const RECORD_TYPES = [
  'Lab Report', 'Prescription', 'Surgery Notes',
  'X-Ray / Scan', 'Vaccination', 'Diagnosis',
  'General Checkup', 'Other'
]

export default function RecordEditForm({ record, onSave, onCancel }) {
  const [title, setTitle] = useState(record.title)
  const [recordType, setRecordType] = useState(record.record_type)
  const [description, setDescription] = useState(record.description)
  const [existingFiles, setExistingFiles] = useState(record.file_urls || [])
  const [removedFiles, setRemovedFiles] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [saving, setSaving] = useState(false)

  const handleRemoveExisting = (url) => {
    setExistingFiles(prev => prev.filter(u => u !== url))
    setRemovedFiles(prev => [...prev, url])
  }

  const handleAddFiles = (e) => {
    setNewFiles(prev => [...prev, ...Array.from(e.target.files)])
  }

  const handleRemoveNew = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setSaving(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('record_type', recordType)
    formData.append('description', description)
    removedFiles.forEach(f => formData.append('removed_files', f))
    newFiles.forEach(f => formData.append('files', f))
    await onSave(record.id, formData)
    setSaving(false)
  }

  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm font-semibold text-gray-600">Editing Record</p>

      <div>
        <label className="text-xs text-gray-500 font-medium">Title</label>
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium">Record Type</label>
        <select
          className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={recordType}
          onChange={e => setRecordType(e.target.value)}
        >
          {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium">Description</label>
        <textarea
          rows={3}
          className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div>
          <label className="text-xs text-gray-500 font-medium">Current Files</label>
          <div className="mt-1 space-y-2">
            {existingFiles.map((url, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 border rounded-lg px-3 py-2">
                <a
                  href={'http://localhost:5000' + url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-teal-600 underline truncate max-w-xs"
                >
                  File {i + 1} — {url.split('/').pop()}
                </a>
                <button
                  onClick={() => handleRemoveExisting(url)}
                  className="text-xs text-red-400 hover:text-red-600 ml-3 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New files to upload */}
      {newFiles.length > 0 && (
        <div>
          <label className="text-xs text-gray-500 font-medium">New Files to Upload</label>
          <div className="mt-1 space-y-2">
            {newFiles.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <span className="text-xs text-blue-700 truncate max-w-xs">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  onClick={() => handleRemoveNew(i)}
                  className="text-xs text-red-400 hover:text-red-600 ml-3 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add more files */}
      <div>
        <label className="cursor-pointer inline-flex items-center gap-2 border border-dashed border-blue-400 text-blue-600 text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition">
          + Add More Files
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.gif,.webp"
            className="hidden"
            onChange={handleAddFiles}
          />
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}