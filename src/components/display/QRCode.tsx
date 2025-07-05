'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  photoId: string | null
  eventId: string | null
}

export default function QRCode({ photoId, eventId }: QRCodeProps) {
  // Create the URL for the action page
  const actionUrl = `${window.location.origin}/action?event=${eventId}&photo=${photoId || ''}`
  
  const handleClick = () => {
    // Open action page in new tab when QR code is clicked
    window.open(actionUrl, '_blank')
  }

  if(!eventId || !photoId) {
    return null
  }
  
  return (
    <div className="bg-white p-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={handleClick}>
      <QRCodeSVG 
        value={actionUrl}
        size={256}
        level="L"
        includeMargin={true}
      />
      <div className="text-center mt-2">
        <p className="text-m font-bold text-black">DROP EEN FOTO</p>
        <p className="text-m font-bold text-black">OF COMMENT</p>
      </div>
    </div>
  )
} 