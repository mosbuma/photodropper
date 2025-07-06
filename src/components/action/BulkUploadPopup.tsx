'use client'

import { useState } from 'react'
import Spinner from '@/components/ui/Spinner'

interface BulkUploadPopupProps {
  eventId: string
  onClose: () => void
  onUploadComplete: () => void
}

interface UploadProgress {
  total: number
  completed: number
  failed: number
  currentFile: string
}

export default function BulkUploadPopup({ eventId, onClose, onUploadComplete }: BulkUploadPopupProps) {
  const [fileList, setFileList] = useState('')
  const [uploaderName, setUploaderName] = useState(typeof window !== 'undefined' ? localStorage.getItem('photodropper_name') || '' : '')
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if we have either text input or dropped files
    const hasTextInput = fileList.trim().length > 0
    const hasDroppedFiles = droppedFiles.length > 0
    
    if (!hasTextInput && !hasDroppedFiles) {
      setError('Please enter file paths or drop image files')
      return
    }

    setIsUploading(true)
    setError(null)

    // Save name to localStorage
    if (uploaderName) {
      localStorage.setItem('photodropper_name', uploaderName)
    }

    let completed = 0
    let failed = 0
    let totalFiles = 0

    // Handle dropped files first
    if (hasDroppedFiles) {
      totalFiles += droppedFiles.length
      setProgress({
        total: totalFiles,
        completed: 0,
        failed: 0,
        currentFile: ''
      })

      for (let i = 0; i < droppedFiles.length; i++) {
        const file = droppedFiles[i]
        setProgress(prev => prev ? { ...prev, currentFile: file.name } : null)

        try {
          // Upload using FormData
          const formData = new FormData()
          formData.append('file', file)
          formData.append('eventId', eventId)
          formData.append('uploaderName', uploaderName)
          formData.append('comment', '')
          formData.append('location', '')
          formData.append('dateTaken', '')

          const uploadResponse = await fetch('/api/photos/upload', {
            method: 'POST',
            body: formData
          })

          if (uploadResponse.ok) {
            completed++
          } else {
            console.error(`Upload failed for ${file.name}:`, await uploadResponse.text())
            failed++
          }
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err)
          failed++
        }

        setProgress(prev => prev ? { ...prev, completed, failed } : null)
      }
    }

    // Handle text input files
    if (hasTextInput) {
      // Parse file list (split by newlines and filter empty lines)
      const textFiles = fileList.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      if (textFiles.length > 0) {
        totalFiles += textFiles.length
        setProgress(prev => prev ? { ...prev, total: totalFiles } : null)

        for (let i = 0; i < textFiles.length; i++) {
          const filePath = textFiles[i]
          setProgress(prev => prev ? { ...prev, currentFile: filePath } : null)

          try {
            // Try to fetch the file from the provided path
            const response = await fetch(filePath)
            if (!response.ok) {
              console.error(`Failed to fetch ${filePath}: ${response.status}`)
              failed++
              continue
            }

            const blob = await response.blob()
            
            // Check if it's an image
            if (!blob.type.startsWith('image/')) {
              console.error(`${filePath} is not an image file`)
              failed++
              continue
            }

            // Create a file object
            const fileName = filePath.split('/').pop() || 'image.jpg'
            const file = new File([blob], fileName, { type: blob.type })

            // Upload using FormData
            const formData = new FormData()
            formData.append('file', file)
            formData.append('eventId', eventId)
            formData.append('uploaderName', uploaderName)
            formData.append('comment', '')
            formData.append('location', '')
            formData.append('dateTaken', '')

            const uploadResponse = await fetch('/api/photos/upload', {
              method: 'POST',
              body: formData
            })

            if (uploadResponse.ok) {
              completed++
            } else {
              console.error(`Upload failed for ${filePath}:`, await uploadResponse.text())
              failed++
            }
          } catch (err) {
            console.error(`Error processing ${filePath}:`, err)
            failed++
          }

          setProgress(prev => prev ? { ...prev, completed, failed } : null)
        }
      }
    }

    setIsUploading(false)
    
    // Show completion message
    if (completed > 0) {
      alert(`Upload completed! Successfully uploaded ${completed} photos${failed > 0 ? `, ${failed} failed` : ''}.`)
      onUploadComplete()
      onClose()
    } else {
      setError(`Upload failed. ${failed} files could not be processed.`)
    }
  }

  const handleCancel = () => {
    if (!isUploading) {
      onClose()
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      setError('Please drop image files only')
      return
    }

    setDroppedFiles(imageFiles)
    setError(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-md relative">
        <button 
          className="absolute top-2 right-2 text-gray-500" 
          onClick={handleCancel}
          disabled={isUploading}
        >
          &times;
        </button>
        
        <h2 className="text-xl font-bold mb-4">Bulk Upload Photos</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Uploader Name
            </label>
            <input
              type="text"
              placeholder="Anonymous"
              value={uploaderName}
              maxLength={10}
              onChange={e => setUploaderName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={isUploading}
            />
          </div>

          {/* Drag and Drop Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Drop Image Files Here
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {droppedFiles.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {droppedFiles.length} file{droppedFiles.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="text-xs text-gray-500 space-y-1 max-h-20 overflow-y-auto">
                    {droppedFiles.map((file, index) => (
                      <div key={index} className="truncate">
                        {file.name}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDroppedFiles([])}
                    className="text-red-600 hover:text-red-700 text-xs mt-2"
                    disabled={isUploading}
                  >
                    Clear files
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-2">
                    Drag and drop image files here
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports JPG, PNG, GIF, WebP, etc.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Or Enter File Paths (one per line)
            </label>
            <textarea
              placeholder="Enter file paths, one per line:&#10;https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg&#10;/path/to/local/file.jpg"
              value={fileList}
              onChange={e => setFileList(e.target.value)}
              className="w-full h-32 px-3 py-2 border rounded resize-none"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports HTTP URLs and local file paths
            </p>
          </div>

          {progress && (
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress: {progress.completed + progress.failed}/{progress.total}</span>
                <span>Failed: {progress.failed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((progress.completed + progress.failed) / progress.total) * 100}%` }}
                ></div>
              </div>
              {progress.currentFile && (
                <p className="text-xs text-gray-600 mt-1 truncate">
                  Current: {progress.currentFile}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-600 mb-4 text-sm">{error}</div>
          )}

          <div className="flex gap-2 justify-center">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
              disabled={isUploading || (!fileList.trim() && droppedFiles.length === 0)}
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Uploading...
                </div>
              ) : (
                'Upload Photos'
              )}
            </button>
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 