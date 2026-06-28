'use client'

import { useRef, useState } from 'react'
import { extractExifData, getLocationFromExif } from '@/lib/photoMeta'
import {
  getMediaKind,
  getUploadValidationError,
  getVideoCompatibilityWarning,
  formatFileDate,
  getVideoDurationMs,
  captureVideoThumbnail,
} from '@/lib/mediaUtils'
import { getResponseErrorMessage } from '@/lib/fetchUtils'
import { useMobileLandscape } from '@/lib/useIsMobile'
import Spinner from '@/components/ui/Spinner'
import RotateDevicePrompt from '@/components/ui/RotateDevicePrompt'

interface UploadPhotoPopupProps {
  eventId: string
  eventName?: string
  accessCode: string
  onClose: () => void
}

interface PhotoMeta {
  name: string
  comment: string
  location: string
  date: string
}

export default function UploadPhotoPopup({ eventId, eventName, accessCode, onClose }: UploadPhotoPopupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mobileLandscape = useMobileLandscape()
  const [step, setStep] = useState<'select' | 'processing' | 'preview' | 'uploading' | 'success'>('select')
  const [file, setFile] = useState<File | null>(null)
  const [mediaKind, setMediaKind] = useState<'image' | 'video'>('image')
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [compatWarning, setCompatWarning] = useState<string | null>(null)
  const [meta, setMeta] = useState<PhotoMeta>({
    name: typeof window !== 'undefined' ? localStorage.getItem('photodropper_name') || '' : '',
    comment: '',
    location: '',
    date: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    const fileError = getUploadValidationError(f)
    if (fileError) {
      setError(fileError)
      e.target.value = ''
      return
    }

    setFile(f)
    setMediaKind(getMediaKind(f) || 'image')
    setStep('processing')
    processFile(f)
  }

  const processFile = async (f: File) => {
    setError(null)
    setCompatWarning(getVideoCompatibilityWarning(f))
    const kind = getMediaKind(f) || 'image'

    try {
      let updatedMeta = { ...meta }

      if (kind === 'image') {
        const exifData = await extractExifData(f)
        updatedMeta = {
          ...updatedMeta,
          date: exifData.createdAt?.description || exifData.DateTimeOriginal?.description || '',
        }
        try {
          updatedMeta.location = (await getLocationFromExif(exifData)) || ''
        } catch {
          updatedMeta.location = ''
        }
        setDurationMs(null)
        setThumbnailBlob(null)
      } else {
        updatedMeta.date = formatFileDate(f)
        updatedMeta.location = ''
        const duration = await getVideoDurationMs(f)
        setDurationMs(duration)
        const thumb = await captureVideoThumbnail(f)
        setThumbnailBlob(thumb)
      }

      setMeta(updatedMeta)
      setPreviewUrl(URL.createObjectURL(f))
      setStep('preview')
    } catch (err) {
      console.error('Error processing file:', err)
      setError('Kon bestand niet verwerken')
      setStep('select')
    }
  }

  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setError(null)
    setStep('uploading')

    try {
      if (meta.name) {
        localStorage.setItem('photodropper_name', meta.name)
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', eventId)
      formData.append('accessCode', accessCode)
      formData.append('uploaderName', meta.name)
      formData.append('comment', meta.comment)
      formData.append('location', meta.location)
      formData.append('dateTaken', meta.date)
      if (durationMs != null) {
        formData.append('durationMs', String(durationMs))
      }
      if (thumbnailBlob) {
        formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg')
      }

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response))
      }

      setStep('success')
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon niet verzenden')
      setStep('preview')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-sm relative max-h-[95vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4 pr-6">
          Foto of video uploaden{eventName ? ` naar ${eventName}` : ''}
        </h2>

        {mobileLandscape && (step === 'select' || step === 'preview') ? (
          <>
            <RotateDevicePrompt message="Draai je telefoon om te uploaden" />
            <div className="flex justify-center mt-2">
              <button
                type="button"
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={onClose}
              >
                Annuleren
              </button>
            </div>
          </>
        ) : (
          <>
        <div className="mb-4 rounded max-h-40 mx-auto relative w-full h-40 flex items-center justify-center bg-gray-100">
          {previewUrl ? (
            mediaKind === 'video' ? (
              <video src={previewUrl} controls className="max-h-40 w-full object-contain rounded" />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={previewUrl} alt="Voorbeeld" className="max-h-40 w-full object-contain rounded" />
            )
          ) : (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Bestand kiezen
            </button>
          )}
          <input
            type="file"
            accept="image/*,.heic,.heif,video/*,.mp4,.mov,.webm,.m4v,.mkv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {compatWarning && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-300 rounded text-amber-900 text-sm">
            {compatWarning}
          </div>
        )}
        <form onSubmit={handleMetaSubmit}>
          <input
            type="text"
            placeholder="Naam (anoniem)"
            value={meta.name}
            maxLength={10}
            onChange={e => setMeta({ ...meta, name: e.target.value })}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Reactie (optioneel)"
            value={meta.comment}
            maxLength={100}
            onChange={e => setMeta({ ...meta, comment: e.target.value })}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Locatie (optioneel)"
            value={meta.location}
            onChange={e => setMeta({ ...meta, location: e.target.value })}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Datum (optioneel)"
            value={meta.date}
            onChange={e => setMeta({ ...meta, date: e.target.value })}
            className="w-full mb-2 px-3 py-2 border rounded"
          />
          <div className="flex gap-10 mt-4 justify-center">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              disabled={!file || step === 'processing' || step === 'uploading'}
            >
              GA!
            </button>
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Annuleren
            </button>
          </div>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center min-h-[100px] mt-4">
            <Spinner size="lg" className="mb-4" />
            <p>Verwerken...</p>
          </div>
        )}
        {step === 'uploading' && (
          <div className="flex flex-col items-center justify-center min-h-[100px] mt-4">
            <Spinner size="lg" className="mb-4" />
            <p>Uploaden...</p>
          </div>
        )}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center min-h-[100px] mt-4">
            <div className="text-green-600 text-4xl mb-2">✓</div>
            <p>Upload gelukt!</p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
