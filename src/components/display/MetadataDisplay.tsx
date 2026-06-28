'use client'

import { useIsLandscape } from '@/lib/useIsMobile'

interface MetadataDisplayProps {
  dateTaken: string | null
  location: string | null
  compact?: boolean
}

export default function MetadataDisplay({ dateTaken, location, compact = false }: MetadataDisplayProps) {
  const isLandscape = useIsLandscape()

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    
    let date: Date | null = null
    
    date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      // Valid date
    } else {
      const exifMatch = dateString.match(/^(\d{4}):(\d{2}):(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/)
      if (exifMatch) {
        const [, year, month, day, hour = '00', minute = '00', second = '00'] = exifMatch
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second))
      }
    }
    
    if (!date || isNaN(date.getTime())) {
      return null
    }
    
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Vandaag'
    if (diffDays === 2) return 'Gisteren'
    if (diffDays <= 7) return 'Vorige week'
    if (diffDays <= 30) return 'Vorige maand'
    
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('nl-NL', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
    
    return date.toLocaleDateString('nl-NL', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formattedDate = dateTaken ? formatDate(dateTaken) : null

  if (!formattedDate && !location) {
    return null
  }

  const boxClass = compact
    ? isLandscape
      ? 'font-semibold bg-yellow-500 text-white text-center rounded px-1.5 py-0.5 text-[10px] leading-tight max-w-[22vw] truncate'
      : 'font-bold bg-yellow-500 text-white text-center rounded-lg px-2 py-1 text-xs leading-tight max-w-[45vw]'
    : 'font-bold bg-yellow-500 text-white flex items-center justify-center text-center rounded-lg px-2 py-4 text-[48px] leading-none min-w-[250px] min-h-[48px]'

  const containerClass = compact && isLandscape
    ? 'flex flex-row gap-1 justify-end'
    : 'flex flex-col gap-1'

  return (
    <div key="metadata" className={containerClass}>
      {formattedDate && (
        <div key="date" className={boxClass}>
          {formattedDate}
        </div>
      )}
      {location && (
        <div key="location" className={boxClass}>
          {location}
        </div>
      )}
    </div>
  )
}
