import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyEventAccess } from '@/lib/eventAccess'

export async function requireGuestEventAccess(
  eventId: string,
  accessCode: string | null | undefined
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (session) return null

  if (!accessCode || !(await verifyEventAccess(eventId, accessCode))) {
    return NextResponse.json({ error: 'Ongeldige toegangscode' }, { status: 403 })
  }

  return null
}

export function readAccessCodeFromForm(formData: FormData): string | null {
  const value = formData.get('accessCode')
  return typeof value === 'string' && value.trim() ? value : null
}

export function readAccessCodeFromBody(body: Record<string, unknown>): string | null {
  const value = body.accessCode
  return typeof value === 'string' && value.trim() ? value : null
}
