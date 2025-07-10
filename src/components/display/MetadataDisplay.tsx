'use client'

interface MetadataDisplayProps {
  dateTaken: string | null
  location: string | null
}

export default function MetadataDisplay({ dateTaken, location }: MetadataDisplayProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    
    // Try to parse the date string - it could be in various formats
    let date: Date | null = null
    
    // Try parsing as ISO string first
    date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      // Valid date
    } else {
      // Try parsing EXIF format (YYYY:MM:DD HH:mm:ss)
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
    
    // Same year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
    
    // Different year
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formattedDate = dateTaken ? formatDate(dateTaken) : null

  if (!formattedDate && !location) {
    return null
  }

  const className='text-base font-bold bg-yellow-500 text-white flex items-center justify-center text-center px-2 py-4 rounded-lg';
  const style={fontSize: '48px', minWidth: '250px', minHeight: '48px'};

  return (
    <div key="metadata" className="flex flex-col gap-2">
      {formattedDate && (
        <div key="date" className={className} style={style}>
          {formattedDate}
        </div>
      )}
      {location && (
        <div key="location" className={className} style={style}>
          {location}
        </div>
      )}
    </div>
  )
} 