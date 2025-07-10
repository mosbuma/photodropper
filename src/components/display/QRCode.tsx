'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import Spinner from '@/components/ui/Spinner'

interface QRCodeProps {
  photoId: string
  eventId: string
  large: boolean
}

export default function QRCode({ photoId, eventId, large = true }: QRCodeProps) {
  const [baseUrl, setBaseUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBaseUrl() {
      try {
        const res = await fetch('/api/local-ip')
        if (res.ok) {
          const data = await res.json()
          // The API now returns either a full URL (production) or just an IP (development)
          const url = data.localIp
          if (url && url.startsWith('http')) {
            // Production: API returned full URL
            setBaseUrl(url)
          } else if (url) {
            // Development: API returned just IP, construct full URL
            setBaseUrl(`http://${url}:3000`)
          } else {
            // Fallback to window.location.origin
            setBaseUrl(typeof window !== 'undefined' ? window.location.origin : '')
          }
        } else {
          // API failed, fallback to window.location.origin
          setBaseUrl(typeof window !== 'undefined' ? window.location.origin : '')
        }
      } catch (error) {
        console.error('Error fetching base URL:', error)
        // Fallback to window.location.origin if API fails
        setBaseUrl(typeof window !== 'undefined' ? window.location.origin : '')
      } finally {
        setLoading(false)
      }
    }
    fetchBaseUrl()
  }, [])

  const actionUrl = baseUrl ? `${baseUrl}/action?event=${eventId}&photo=${photoId || ''}` : ''

  const handleClick = (e: React.MouseEvent) => {
    // Prevent event propagation to parent
    e.stopPropagation()
    
    // Open action page in new tab when QR code is clicked
    if (actionUrl) {
      window.open(actionUrl, '_blank')
    }
  }

  if (loading) {
    return <div className="bg-white p-2 rounded-lg shadow-lg flex items-center justify-center" style={{width:256, height:256}}><Spinner size="lg" /></div>
  }

  console.log(`[QRCode] actionUrl: ${actionUrl}`)
  
  return (
    <div className="bg-white p-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={handleClick}>
      <QRCodeSVG 
        value={actionUrl}
        size={large ? 256: 128}
        level="L"
        includeMargin={true}
      />
    </div>
  )
} 