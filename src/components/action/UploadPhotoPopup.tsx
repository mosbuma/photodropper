'use client'

import { useRef, useState } from 'react'
import { extractExifData, getLocationFromExif } from '@/lib/photoMeta'
import Spinner from '@/components/ui/Spinner'
import Image from 'next/image'

interface UploadPhotoPopupProps {
  eventId: string
  eventName?: string
  onClose: () => void
}

interface PhotoMeta {
  name: string
  comment: string
  location: string
  date: string
}

export default function UploadPhotoPopup({ eventId, eventName, onClose }: UploadPhotoPopupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'select' | 'uploading' | 'done'>('select')
  const [file, setFile] = useState<File | null>(null)
  const [meta, setMeta] = useState<PhotoMeta>({
    name: typeof window !== 'undefined' ? localStorage.getItem('photodropper_name') || '' : '',
    comment: '',
    location: '',
    date: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Step 1: Select file and upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setStep('uploading')
      uploadFile(f)
    }
  }

  // Step 2: Upload file to backend with EXIF extraction
  const uploadFile = async (f: File) => {
    setError(null)
    try {
      // Extract EXIF data
      const exifData = await extractExifData(f)
      

      const updatedMeta = { ...meta, date: exifData.createdAt?.description || exifData.DateTimeOriginal?.description || ''  }

      // Location from EXIF GPS (decimal)
      try {
        const locationName = await getLocationFromExif(exifData)
        updatedMeta.location = locationName || ''
      } catch (error) {
        console.error('Error looking up location from GPS:', error)
        updatedMeta.location = ''
      }

      setMeta(updatedMeta)
      setPhotoUrl(URL.createObjectURL(f))
      setStep('done')
    } catch (error) {
      console.error('Error in uploadFile:', error)
      setError('Failed to process photo')
      setStep('select')
    }
  }

  // Step 3: Submit metadata to backend
  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    
    setError(null)
    setStep('uploading')
    
    try {
      // Save name to localStorage
      if (meta.name) {
        localStorage.setItem('photodropper_name', meta.name)
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', eventId)
      formData.append('uploaderName', meta.name)
      formData.append('comment', meta.comment)
      formData.append('location', meta.location)
      formData.append('dateTaken', meta.date)

      // Upload to backend
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      setStep('done')
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit photo info')
      setStep('done')
    }
  }

  // Step 4: Cancel
  const handleCancel = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-sm relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">
          Upload a Photo{eventName ? ` to ${eventName}` : ''}
        </h2>
        {/* Image area with upload button if no image selected */}
        <div className="mb-4 rounded max-h-40 mx-auto relative w-full h-40 flex items-center justify-center bg-gray-100">
          {photoUrl ? (
            <Image src={photoUrl} alt="Preview" fill className="object-contain rounded" />
          ) : (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Choose File
            </button>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {/* Always show metadata fields and buttons */}
        <form onSubmit={handleMetaSubmit}>
          <input
            type="text"
            placeholder="Name (Anonymous)"
            value={meta.name}
            maxLength={10}
            onChange={e => setMeta({ ...meta, name: e.target.value })}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Comment (optional)"
            value={meta.comment}
            maxLength={100}
            onChange={e => setMeta({ ...meta, comment: e.target.value })}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Location (optional)"
            value={meta.location}
            onChange={e => setMeta({ ...meta, location: e.target.value })}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Date (optional)"
            value={meta.date}
            onChange={e => setMeta({ ...meta, date: e.target.value })}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <div className="flex gap-10 mt-4 justify-center">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              disabled={!file || step === 'uploading'}
            >
              GO!
            </button>
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
        {/* Uploading and done states */}
        {step === 'uploading' && (
          <div className="flex flex-col items-center justify-center min-h-[100px] mt-4">
            <Spinner size="lg" className="mb-4" />
            <p>Processing photo...</p>
          </div>
        )}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center min-h-[100px] mt-4">
            <div className="text-green-600 text-4xl mb-2">✓</div>
            <p>Photo uploaded successfully!</p>
          </div>
        )}
      </div>
    </div>
  )
} 