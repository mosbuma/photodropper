'use client'

interface MetadataDisplayProps {
  dateTaken: string | null
  location: string | null
}

export default function MetadataDisplay({ dateTaken, location }: MetadataDisplayProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    
    const date = new Date(dateString)
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

  return (
    <div className="bg-black bg-opacity-80 rounded-lg px-5 py-2 shadow-lg flex flex-col items-end min-w-[160px] max-w-xs" style={{fontFamily: 'Inter, Roboto, Arial, sans-serif', letterSpacing: '0.01em'}}>
      {formattedDate && (
        <div className="text-base font-bold text-white drop-shadow mb-1 leading-tight">
          {formattedDate}
        </div>
      )}
      {location && (
        <div className="text-sm text-white font-medium flex items-center gap-1 drop-shadow">
          <span className="truncate" style={{fontFamily: 'Inter, Roboto, Arial, sans-serif', fontSize: '48px'}}>{location}</span>
        </div>
      )}
    </div>
  )
} 