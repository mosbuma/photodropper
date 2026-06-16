import os from 'os'
import { NextRequest, NextResponse } from 'next/server'

function baseUrlFromRequest(req: NextRequest): string | null {
  const configured = process.env.PUBLIC_BASE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')

  const host = req.headers.get('host')
  if (!host) return null

  const port = process.env.PORT || '3000'
  const hostWithoutPort = host.split(':')[0]
  const protocol = req.headers.get('x-forwarded-proto') || 'http'
  const hostHasPort = host.includes(':')
  const displayHost = hostHasPort ? host : `${hostWithoutPort}:${port}`
  return `${protocol}://${displayHost}`
}

export async function GET(req: NextRequest) {
  const fromRequest = baseUrlFromRequest(req)
  if (fromRequest && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ localIp: fromRequest })
  }

  const interfaces = os.networkInterfaces()
  let localIp: string | null = null
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address
        break
      }
    }
    if (localIp) break
  }

  const port = process.env.PORT || '3000'
  const url = localIp ? `http://${localIp}:${port}` : fromRequest || `http://127.0.0.1:${port}`
  return NextResponse.json({ localIp: url })
}
