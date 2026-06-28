'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { verifyAndGrantEventAccess } from '@/lib/eventAccessClient'
import { buildActionPath } from '@/lib/eventAccess'

export default function JoinPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const code = searchParams.get('code') || ''
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug || !code) {
      setError('Deze link is onvolledig. Vraag de organisator om een volledige uitnodigingslink.')
      return
    }

    let cancelled = false

    async function join() {
      const result = await verifyAndGrantEventAccess({ slug, code })
      if (cancelled) return

      if (!result.ok || !result.eventId) {
        setError(result.error || 'Ongeldige feestlink of toegangscode.')
        return
      }

      router.replace(buildActionPath(result.eventId, code))
    }

    join()
    return () => {
      cancelled = true
    }
  }, [slug, code, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <h1 className="text-2xl font-bold mb-3">Kan niet deelnemen</h1>
            <p className="text-gray-300">{error}</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4" />
            <p>Feest openen...</p>
          </>
        )}
      </div>
    </div>
  )
}
