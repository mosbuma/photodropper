'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import Spinner from '@/components/ui/Spinner'

interface QRCodeProps {
  photoId: string
  eventId: string
}

export default function QRCode({ photoId, eventId }: QRCodeProps) {
  const [localIp, setLocalIp] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIp() {
      try {
        const res = await fetch('/api/local-ip')
        if (res.ok) {
          const data = await res.json()
          setLocalIp('http://' + data.localIp + ':3000')
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchIp()
  }, [])

  const origin = localIp || (typeof window !== 'undefined' ? window.location.origin : '')
  const actionUrl = `${origin}/action?event=${eventId}&photo=${photoId || ''}`

  const handleClick = () => {
    // Open action page in new tab when QR code is clicked
    window.open(actionUrl, '_blank')
  }

  if (loading) {
    return <div className="bg-white p-2 rounded-lg shadow-lg flex items-center justify-center" style={{width:256, height:256}}><Spinner size="lg" /></div>
  }

  console.log(`[QRCode] actionUrl: ${actionUrl}`)
  
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