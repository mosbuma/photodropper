'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  photoId?: string
  eventId: string
}

export default function QRCode({ photoId, eventId }: QRCodeProps) {
  // Create the URL for the action page
  const actionUrl = `${window.location.origin}/action?event=${eventId}&photo=${photoId || ''}`
  
  const handleClick = () => {
    // Open action page in new tab when QR code is clicked
    window.open(actionUrl, '_blank')
  }
  
  return (
    <div className="bg-white p-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={handleClick}>
      <QRCodeSVG 
        value={actionUrl}
        size={128}
        level="H"
        includeMargin={true}
      />
      <div className="text-center mt-2">
        <p className="text-xs text-gray-600">Scan to upload</p>
        <p className="text-xs text-blue-600">Click to open</p>
      </div>
    </div>
  )
} 