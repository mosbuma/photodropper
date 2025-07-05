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

  const className='text-base font-bold bg-yellow-500 text-white flex items-center px-2 py-4 rounded-lg';
  const style={fontSize: '48px', minWidth: '250px', minHeight: '48px'};

  return (
    <div key="metadata" className="flex flex-col gap-2">
      <div key="date" className={`${className} ${formattedDate ? 'visible' : 'invisible'}`} style={style}>
        {formattedDate || 'XXXX'}
      </div>
      <div key="location" className={`${className} ${location ? 'visible' : 'invisible'}`} style={style}>
        {location || 'XXXX'}
      </div>
    </div>
  )
} 